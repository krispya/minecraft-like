// Timing primitives use cut beats relative to `song.trimBeats` on the analyzed grid.

import { useCurrentFrame, useVideoConfig } from 'remotion';
import analysis from './beats.json';
import { cues, footage, song } from './cues';

export const bpm = analysis.bpm;
export const secondsPerBeat = 60 / analysis.bpm;

// Song time where cut beat 0 begins.
export const songStart = analysis.offset + song.trimBeats * secondsPerBeat;

export const endBeat = Math.max(...cues.map((cue) => cue.at + cue.hold)) + song.fadeOut;

// Footage boundaries and card edges that drive the cut flash.
export const cutBeats = [
  ...footage.flatMap(({ at, shots }) => {
    let beat = at;
    return shots.map(([start, end]) => {
      const from = beat;
      beat += (end - start) / secondsPerBeat;
      return from;
    });
  }),
  ...cues.filter((cue) => cue.kind === 'card').flatMap((cue) => [cue.at, cue.at + cue.hold]),
];

export function beatsToFrames(beats: number, fps: number) {
  return Math.round(beats * secondsPerBeat * fps);
}

export function totalFrames(fps: number) {
  return beatsToFrames(endBeat, fps);
}

// Continuous cut-beat position. For example, 4.5 is halfway through beat 4.
export function useBeatPosition() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps / secondsPerBeat;
}

// Sawtooth pulse that decays from 1 on each selected beat.
export function useBeatPulse(every = 1, sharpness = 3) {
  const position = useBeatPosition();
  if (position < 0) return 0;
  const sincePulse = (position / every) % 1;
  return (1 - sincePulse) ** sharpness;
}
