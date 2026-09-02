# promo

Remotion project that lays text over `track_promo.mp4` on the beat.

It is deliberately **not** part of the game's pnpm workspace. It has its own
`pnpm-workspace.yaml`, so the Remotion dependency tree never lands in the game
install and `pnpm install` at the repo root is unaffected.

```sh
cd promo
pnpm install
pnpm proxy    # transcode the HEVC source to H.264 in public/, once
pnpm analyze  # detect tempo, beat phase, onsets and scene cuts
pnpm dev      # Remotion Studio at localhost:3000
```

## Rendering

```sh
pnpm render  # 1920x1080 -> out/promo.mp4
```

About 35 seconds for the 20 second piece.

## How the timing works

`scripts/analyze.mjs` decodes the audio with ffmpeg, builds a spectral flux
onset envelope from an STFT, picks the tempo by autocorrelation, then refines
tempo and phase together with a comb filter. The joint refinement matters: a
coarse estimate that is half a BPM out drifts a visible fraction of a beat over
20 seconds.

For this track it lands on **90.00 BPM with the first beat at 0.282s**, and
every detected onset sits within 7ms of the resulting half beat grid. The
detected scene cuts fall on even beats, so the footage was already edited to
the track.

Output goes to `src/beats.json` and is imported directly, so timings are
resolved at build time rather than fetched.

`src/beat.ts` turns that into primitives. Everything downstream is authored in
**beats**, never seconds or frames, so re running the analyzer on a different
track moves the whole edit with it.

## Changing the promo

`src/cues.ts` is the edit. Each cue has an `at` and a `hold` in beats:

```ts
{ at: 11, hold: 4, kind: 'lower', kicker: 'BUILD', text: 'A product configurator' }
```

Five treatments, in `src/components/cue-views.tsx`:

- `intro` the opening card. A right justified sentence centred in the frame,
  each line backed by its own block of colour that winds up, sweeps past its
  mark and settles, then stretches once before snapping back out
- `title` the poster measure. Stacked lines split on the separator `' / '`,
  every line scaled to fill the same width, each wiping up out of a mask
- `lower` lower third, kicker and rule wiping out from the left
- `stamp` corner tag with no easing at all, which is what makes it read as
  locked to the drum rather than animated
- `bumper` end card, the `LogoFull` wordmark from `@pmndrs/branding` with the
  signup url landing a beat later

`@pmndrs/branding` ships a Babel 7 build that imports `@babel/runtime` without
declaring it, so this project pins `@babel/runtime@^7` directly. Version 8 drops
the `helpers/esm/*` export paths that build needs.

`src/components/chrome.tsx` holds the full length furniture: the cut flash,
edge scrims, vignette and grain.

## Format notes

The source is 2048x1556 at 50fps with roughly 16:9 content letterboxed inside
it on most shots. Compositions run at 50fps so every frame maps to one source
frame.

The delivery crops to 16:9, which lands close to those baked in bars. Cues are
authored against a fixed 1920x1080 design frame that is scaled to the delivery,
so the layout is resolution independent.
