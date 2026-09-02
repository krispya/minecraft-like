// Turns the analysis in beats.json into timing primitives.
//
// The analyzer runs on the song, so the grid is the song's. The cut starts
// `song.trimBeats` into it and everything downstream is authored in cut beats,
// never in seconds or frames, so re trimming or re analyzing the song moves
// the whole edit with it.

import { useCurrentFrame, useVideoConfig } from 'remotion';
import analysis from './beats.json';
import { cues, footage, song } from './cues';

export const bpm = analysis.bpm;
export const secondsPerBeat = 60 / analysis.bpm;

// Where the cut begins in the song. Cut beat 0 sits exactly on a song beat, so
// no grid offset is left over inside the cut.
export const songStart = analysis.offset + song.trimBeats * secondsPerBeat;

// Last cue out, plus the fade
export const endBeat = Math.max(...cues.map((cue) => cue.at + cue.hold)) + song.fadeOut;

// Hard cuts in the picture: every shot boundary in the footage and both edges
// of every card. Drives the cut flash.
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

// Continuous position on the grid. 4.5 means halfway between beat 4 and beat 5.
export function useBeatPosition() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps / secondsPerBeat;
}

// Sawtooth that snaps to 1 on every beat and decays to 0 before the next one.
// The exponent shapes how sharp the attack reads, higher is tighter.
export function useBeatPulse(every = 1, sharpness = 3) {
  const position = useBeatPosition();
  if (position < 0) return 0;
  const sincePulse = (position / every) % 1;
  return (1 - sincePulse) ** sharpness;
}
