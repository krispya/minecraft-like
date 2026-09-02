// Cue timing uses cut beats. Title lines are separated by ` / `.

export type Cue = { at: number; hold: number } & (
  | { kind: 'title'; text: string; stagger?: number }
  | { kind: 'lower'; text: string; kicker?: string }
  | { kind: 'stamp'; text: string }
  | { kind: 'card'; text: string; lead?: string; sub?: string; stagger?: number }
  | { kind: 'list'; items: string[]; every?: number }
  | { kind: 'bumper'; url: string }
);

export const song = { file: 'another_mix_ig.mp3', trimBeats: 11.01, fadeOut: 1 };

// Playlists start on a cut beat and play source ranges consecutively.
export type Playlist = {
  // Start time in cut beats.
  at: number;
  // Source ranges in seconds.
  shots: [number, number][];
  // Proxy filename in public. Defaults to the workshop reel.
  src?: string;
  // Source seconds played per output second.
  rate?: number;
  // Fade duration in cut beats at the end of the final shot.
  fade?: number;
};

export const footage: Playlist[] = [
  { at: 0, src: 'minecraft-like.mp4', shots: [[1, 4.07]] },
  {
    at: 6.6,
    shots: [
      [7.66, 8.82],
      [15.4, 16.25],
      [8.82, 10.32],
      [5.56, 6.5],
      [10.32, 12.4],
      [12.4, 15.12],
    ],
  },
  { at: 20.47, src: 'minecraft-like.mp4', shots: [[10, 12.39]] },
  // Watch configurator under the learn list, long enough to cut straight into the date card
  { at: 26.05, src: 'faraz_watch.mp4', shots: [[1, 4.33]] },
];

export const cues: Cue[] = [
  {
    at: 4.6,
    hold: 2,
    kind: 'card',
    lead: 'Advanced R3F Workshop',
    text: "What you'll build",
    stagger: 0.75,
  },
  { at: 6.6, hold: 5.25, kind: 'lower', text: 'Product configurator' },
  { at: 11.9, hold: 4.5, kind: 'lower', text: 'Website hero' },
  { at: 16.4, hold: 7.6, kind: 'lower', text: 'Voxel game' },

  {
    at: 24.05,
    hold: 2,
    kind: 'card',
    lead: "What you'll learn",
    text: 'React Three Fiber v10',
    stagger: 0.75,
  },
  {
    at: 26.05,
    hold: 5,
    kind: 'list',
    every: 0.5,
    items: [
      'WebGPU & WebGL, one API',
      'TSL node materials',
      'Postprocessing in TSL',
      'The frame scheduler',
      'Multi canvas',
      'Instancing & batching',
      'Compute shaders',
      'Profiling & memory budgets',
    ],
  },

  { at: 31.05, hold: 4, kind: 'card', text: 'Sept 8 & 9, 2026', sub: 'Gobelins · Paris' },
  { at: 35.05, hold: 4, kind: 'bumper', url: 'signup 👉 threejs.paris/workshop' },
];
