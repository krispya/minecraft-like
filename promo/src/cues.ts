// The edit. This is the file to change when rewriting the promo.
//
// Everything is measured in cut beats. Cut beat 0 is `song.trimBeats` beats into
// the song, one beat is 0.667s at 90 BPM, and half beats are allowed. Title
// text is split into stacked lines on ` / `, one line per stagger.
//
// Run `pnpm analyze` after swapping the song to regenerate the grid.

export type Cue = { at: number; hold: number } & (
  | { kind: 'title'; text: string; stagger?: number }
  | { kind: 'lower'; text: string; kicker?: string }
  | { kind: 'stamp'; text: string }
  | { kind: 'card'; text: string; lead?: string; sub?: string; stagger?: number }
  | { kind: 'list'; items: string[]; every?: number }
  | { kind: 'bumper'; url: string }
);

// The song has a pickup hit on song beat 17 and the wall of sound lands just
// after 17.5, at 11.72s. The trim puts that wall on frame 220, 0:04.20, which
// is where the original cut had its first hard cut after the card. That is cut
// beat 6.6, so the grid runs a fraction ahead of the song's and cues sit on
// x.6 and x.1 rather than whole numbers. The trim also carries the 40ms the
// rendered AAC track starts late, measured on the output.
export const song = { file: 'another_mix_ig.mp3', trimBeats: 11.01, fadeOut: 1 };

// Footage playlists. Each plays its shots back to back at natural length from
// a start beat, so shot changes fall where the source cut them and only the
// cues sit on the grid. Cards fill the gaps between playlists with black. A
// playlist can play faster than real time with `rate`, and can fade its last
// shot to the ground over `fade` beats.
//
// Shots are [in, out] in source seconds. Cuts in track_promo.mp4 for reference:
// 0.42 game  5.56 eiffel night  6.50 eiffel day  7.66 configurator
// 8.82 blender  10.32 eiffel dusk  12.40 terrain  13.68 pigs  14.44 herd
// 15.40 configurator pair  18.32 snow build  20.40 end
export type Playlist = {
  at: number;
  shots: [number, number][];
  // Proxy in public/, defaults to the workshop reel
  src?: string;
  // Playback speed. 3 plays three seconds of source in one second of cut
  rate?: number;
  fade?: number;
};

export const footage: Playlist[] = [
  // The newer game capture from about a second in, the ride up the snow, up
  // to the card
  { at: 0, src: 'minecraft-like.mp4', shots: [[1, 4.07]] },
  // Build, in on the drop. Configurator with its blender pipeline, Paris as
  // the hero, then the voxel game. The reel's voxel shot is cut before it runs
  // into the configurator, and the new capture carries the group to the silence
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
  // Learn. The opening of the Paris capture, the city, lights, letters, AO,
  // bloom and shadows stacking onto the tower, at three times speed so the
  // whole build up fits the list, then handing over to the dark ground
  { at: 26.05, src: 'paris_promo_full.mp4', shots: [[1, 11]], rate: 3, fade: 0.5 },
];

export const cues: Cue[] = [
  // Right before the drop. The two lines land a beat apart and are both
  // standing before the wall of sound hits
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

  // The song drops out after its hit here, so picture and sound stop together
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
