// Extracts a beat grid from a video or audio file and writes src/beats.json
//
// Pipeline: ffmpeg decodes to mono PCM, an STFT gives a spectral flux onset
// envelope, autocorrelation of that envelope picks the tempo, and a comb filter
// picks the phase. Scene cuts come from ffmpeg scene detection.
//
// Usage: node scripts/analyze.mjs media/another_mix_ig.mp3

import { execFileSync, spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const input = resolve(process.argv[2] ?? 'media/another_mix_ig.mp3');
const output = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'beats.json');

// Analysis rate. 22050 / 256 gives about 86 onset samples per second which
// resolves anything up to roughly 300 BPM.
const sampleRate = 22050;
const fftSize = 1024;
const hopSize = 256;

function decodeMono(file) {
  const pcm = execFileSync(
    'ffmpeg',
    // prettier-ignore
    ['-v', 'error', '-i', file, '-map', 'a:0', '-ac', '1', '-ar', String(sampleRate), '-f', 'f32le', '-'],
    { maxBuffer: 1 << 30, encoding: 'buffer' }
  );
  return new Float32Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.length / 4));
}

// In place iterative radix 2 FFT on split real and imaginary arrays
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wRe = Math.cos(ang);
    const wIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let curRe = 1;
      let curIm = 0;
      for (let k = 0; k < len / 2; k++) {
        const uRe = re[i + k];
        const uIm = im[i + k];
        const vRe = re[i + k + len / 2] * curRe - im[i + k + len / 2] * curIm;
        const vIm = re[i + k + len / 2] * curIm + im[i + k + len / 2] * curRe;
        re[i + k] = uRe + vRe;
        im[i + k] = uIm + vIm;
        re[i + k + len / 2] = uRe - vRe;
        im[i + k + len / 2] = uIm - vIm;
        const nextRe = curRe * wRe - curIm * wIm;
        curIm = curRe * wIm + curIm * wRe;
        curRe = nextRe;
      }
    }
  }
}

// Sum of positive frame to frame change in log magnitude across all bins
function onsetEnvelope(samples) {
  const window = Float32Array.from({ length: fftSize }, (_, i) =>
    Math.max(0, 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / fftSize))
  );
  const frames = Math.floor((samples.length - fftSize) / hopSize);
  const envelope = new Float32Array(Math.max(0, frames));
  let previous = new Float32Array(fftSize / 2);

  for (let f = 0; f < frames; f++) {
    const re = new Float64Array(fftSize);
    const im = new Float64Array(fftSize);
    for (let i = 0; i < fftSize; i++) re[i] = samples[f * hopSize + i] * window[i];
    fft(re, im);

    let flux = 0;
    const current = new Float32Array(fftSize / 2);
    for (let bin = 0; bin < fftSize / 2; bin++) {
      current[bin] = Math.log1p(1000 * Math.hypot(re[bin], im[bin]));
      flux += Math.max(0, current[bin] - previous[bin]);
    }
    envelope[f] = flux;
    previous = current;
  }
  return envelope;
}

// Removes the slow moving floor so loud and quiet sections weigh the same
function normalize(envelope, radius = 43) {
  const out = new Float32Array(envelope.length);
  for (let i = 0; i < envelope.length; i++) {
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - radius); j < Math.min(envelope.length, i + radius); j++) {
      sum += envelope[j];
      count++;
    }
    out[i] = Math.max(0, envelope[i] - sum / count);
  }
  let peak = 0;
  for (const v of out) peak = Math.max(peak, v);
  if (peak > 0) for (let i = 0; i < out.length; i++) out[i] /= peak;
  return out;
}

// Autocorrelation over plausible beat periods, weighted toward 120 BPM so the
// estimate does not settle on a half or double tempo
function estimateTempo(envelope) {
  const framesPerSecond = sampleRate / hopSize;
  let best = { bpm: 120, score: -Infinity };

  for (let bpm = 60; bpm <= 200; bpm += 0.25) {
    const lag = (60 / bpm) * framesPerSecond;
    let sum = 0;
    for (let i = 0; i + lag < envelope.length; i++) {
      const at = i + lag;
      const low = Math.floor(at);
      const frac = at - low;
      sum += envelope[i] * (envelope[low] * (1 - frac) + (envelope[low + 1] ?? 0) * frac);
    }
    const preference = Math.exp(-0.5 * (Math.log2(bpm / 120) / 0.9) ** 2);
    const score = (sum / envelope.length) * preference;
    if (score > best.score) best = { bpm, score };
  }
  return best.bpm;
}

// Joint search over tempo and phase near the coarse estimate. Autocorrelation
// alone is only accurate to a few tenths of a BPM which is enough to drift a
// visible fraction of a beat by the end of a clip, so the comb filter refines
// both at once and scores the mean envelope energy landing on the grid.
function refineGrid(envelope, coarseBpm) {
  const framesPerSecond = sampleRate / hopSize;
  let best = { bpm: coarseBpm, offset: 0, score: -Infinity };

  for (let bpm = coarseBpm - 4; bpm <= coarseBpm + 4; bpm += 0.01) {
    const period = (60 / bpm) * framesPerSecond;
    for (let offset = 0; offset < period; offset += 0.25) {
      let sum = 0;
      let count = 0;
      for (let beat = 0; offset + beat * period < envelope.length - 1; beat++) {
        const at = offset + beat * period;
        const low = Math.floor(at);
        const frac = at - low;
        sum += envelope[low] * (1 - frac) + envelope[low + 1] * frac;
        count++;
      }
      const score = count > 0 ? sum / count : 0;
      if (score > best.score) best = { bpm, offset, score };
    }
  }
  return {
    bpm: best.bpm,
    offset: best.offset / framesPerSecond,
  };
}

// Local maxima above a threshold, used for accents that sit off the grid
function pickOnsets(envelope, minSeparation = 0.12) {
  const framesPerSecond = sampleRate / hopSize;
  const onsets = [];
  let last = -Infinity;
  for (let i = 1; i < envelope.length - 1; i++) {
    if (envelope[i] < 0.18) continue;
    if (envelope[i] < envelope[i - 1] || envelope[i] < envelope[i + 1]) continue;
    const time = i / framesPerSecond;
    if (time - last < minSeparation) continue;
    onsets.push(Number(time.toFixed(3)));
    last = time;
  }
  return onsets;
}

function detectCuts(file, threshold = 0.12) {
  const result = spawnSync(
    'ffmpeg',
    // prettier-ignore
    ['-v', 'error', '-i', file, '-filter:v', `select='gt(scene,${threshold})',metadata=print:file=-`, '-f', 'null', '-'],
    { maxBuffer: 1 << 28, encoding: 'utf8' }
  );
  return [...(result.stdout + result.stderr).matchAll(/pts_time:([0-9.]+)/g)].map((match) =>
    Number(match[1])
  );
}

const duration = Number(
  execFileSync('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'csv=p=0',
    input,
  ])
    .toString()
    .trim()
);

const envelope = normalize(onsetEnvelope(decodeMono(input)));
const { bpm, offset } = refineGrid(envelope, estimateTempo(envelope));

const beats = [];
for (let time = offset; time < duration; time += 60 / bpm) {
  beats.push(Number(time.toFixed(3)));
}

mkdirSync(dirname(output), { recursive: true });
writeFileSync(
  output,
  JSON.stringify(
    {
      source: input.split('/').pop(),
      duration,
      bpm: Number(bpm.toFixed(2)),
      offset: Number(offset.toFixed(3)),
      beats,
      onsets: pickOnsets(envelope),
      cuts: detectCuts(input),
    },
    null,
    '\t'
  ) + '\n'
);

console.log(
  `${bpm.toFixed(2)} BPM, first beat at ${offset.toFixed(3)}s, ${beats.length} beats over ${duration.toFixed(2)}s`
);
console.log(`wrote ${output}`);
