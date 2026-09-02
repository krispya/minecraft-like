// The edit. This is the file to change when rewriting the promo.
//
// Title text is split into stacked lines on ` / `, one line per half beat.
// `intro` is the right justified card centred in the frame, `title` is the
// poster measure where every line is stretched to the same width.
//
// `at` and `hold` are measured in beats, not seconds, so the copy stays locked
// to the track. Beat 0 is the first downbeat the analyzer found, 0.282s in, and
// one beat is 0.667s at 90 BPM. Half beats are allowed.
//
// Run `pnpm analyze` after swapping the source video to regenerate the grid.

export type Cue = { at: number; hold: number } & (
  | { kind: 'title'; text: string; stagger?: number }
  | { kind: 'intro'; text: string; tag?: string; stagger?: number }
  | { kind: 'lower'; kicker: string; text: string }
  | { kind: 'stamp'; text: string }
  | { kind: 'bumper'; url: string }
);

// Cut beats detected in the source, for reference while placing cues:
// 0 game  2  4  6  8 eiffel night  9 eiffel day  11 configurator  13 blender
// 15 eiffel dusk  18 terrain  20 pigs  21 herd  22 configurator  27 build  30 end
export const cues: Cue[] = [
  { at: 1, hold: 5, kind: 'intro', text: 'Advanced R3F workshop. / threejs conf', tag: '' },

  // The callouts hold off until the drop on beat 11, then take one shot each
  { at: 11, hold: 4, kind: 'lower', kicker: 'BUILD A', text: 'Product configurator' },
  { at: 15, hold: 3, kind: 'lower', kicker: 'BUILD A', text: 'Website hero' },
  { at: 18, hold: 4, kind: 'lower', kicker: 'BUILD A', text: 'Voxel game' },

  { at: 22, hold: 4.5, kind: 'title', text: 'SEPT 8 & 9 / 2026', stagger: 0.5 },
  { at: 27, hold: 4, kind: 'bumper', url: 'signup 👉 threejs.paris' },
];
