// Turns the analysis in beats.json into timing primitives.
//
// Everything downstream is authored in beats, never in seconds or frames, so
// swapping the track or re running the analyzer moves the whole edit with it.

import { useCurrentFrame, useVideoConfig } from 'remotion';
import analysis from './beats.json';

export const bpm = analysis.bpm;
export const beatCount = analysis.beats.length;
export const secondsPerBeat = 60 / analysis.bpm;

// Detected scene changes, in beats. Useful for landing a cue on a hard cut.
export const cutBeats = analysis.cuts.map(
  (time) => Math.round(((time - analysis.offset) / secondsPerBeat) * 2) / 2
);

export function beatToFrame(beat: number, fps: number) {
  return Math.round((analysis.offset + beat * secondsPerBeat) * fps);
}

export function beatsToFrames(beats: number, fps: number) {
  return Math.round(beats * secondsPerBeat * fps);
}

export function totalFrames(fps: number) {
  return Math.round(analysis.duration * fps);
}

// Continuous position on the grid. 4.5 means halfway between beat 4 and beat 5.
export function useBeatPosition() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (frame / fps - analysis.offset) / secondsPerBeat;
}

// Sawtooth that snaps to 1 on every beat and decays to 0 before the next one.
// The exponent shapes how sharp the attack reads, higher is tighter.
export function useBeatPulse(every = 1, sharpness = 3) {
  const position = useBeatPosition();
  if (position < 0) return 0;
  const sincePulse = (position / every) % 1;
  return (1 - sincePulse) ** sharpness;
}
