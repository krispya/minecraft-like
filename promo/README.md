# promo

Remotion project that cuts the captures in `media/` to `another_mix_ig.mp3`
and lays text over it on the beat. The captures and the song live in `media/`
under Git LFS, and the transcoded proxies the composition actually reads go in
`public/`, which is ignored.

It is deliberately **not** part of the game's pnpm workspace. It has its own
`pnpm-workspace.yaml`, so the Remotion dependency tree never lands in the game
install and `pnpm install` at the repo root is unaffected.

```sh
cd promo
pnpm install
pnpm proxy    # transcode the HEVC source to H.264 in public/, once
pnpm proxy:game  # same for the game capture, resampled from 120 to 50 fps
pnpm proxy:paris # and for the Paris day and night cycle, from 40 fps
cp media/another_mix_ig.mp3 public/
pnpm analyze  # detect tempo, beat phase and onsets in the song
pnpm dev      # Remotion Studio at localhost:3000
```

## Rendering

```sh
pnpm render  # 1920x1080 -> out/promo.mp4
```

About a minute for the 29 second piece.

## How the timing works

`scripts/analyze.mjs` decodes the song with ffmpeg, builds a spectral flux
onset envelope from an STFT, picks the tempo by autocorrelation, then refines
tempo and phase together with a comb filter. The joint refinement matters: a
coarse estimate that is half a BPM out drifts a visible fraction of a beat over
30 seconds.

For this song it lands on **90.00 BPM with the first beat at 0.020s**. Output
goes to `src/beats.json` and is imported directly, so timings are resolved at
build time rather than fetched.

The cut does not start at the top of the song. `song.trimBeats` in `src/cues.ts`
says how many song beats to skip, chosen so the drop lands on cut beat 8, and
`src/beat.ts` turns the grid into primitives from there. Everything downstream
is authored in **cut beats**, never seconds or frames, so re trimming or re
analyzing the song moves the whole edit with it. The song fades over the last
`song.fadeOut` beats along with the picture, and the composition's length comes
from the last cue rather than from the footage.

## Changing the promo

`src/cues.ts` is the edit. Footage is a set of playlists, each a list of
`[in, out]` source seconds played back to back from a start beat:

```ts
{ at: 13, shots: [[7.66, 8.82], [8.82, 10.32]] }
```

Shots play at natural length, so shot changes fall where the source cut them
and only the cues sit on the grid. A playlist can name its own `src` in
`public/` and a `rate`, which is how the game capture opens the piece and the
Paris effects build up runs under the learn list at three times speed. The gaps between playlists are where the
cards go. Each cue has an `at` and a `hold` in beats:

```ts
{ at: 13, hold: 4, kind: 'lower', kicker: 'BUILD A', text: 'Product configurator' }
```

Six treatments, in `src/components/cue-views.tsx`:

- `title` the poster measure. Stacked lines split on the separator `' / '`,
  every line scaled to fill the same width, each wiping up out of a mask
- `card` a chapter card. One centred line on the dark ground, an optional
  second line under it, and no motion at all. It cuts in and cuts out. With a
  `lead` it becomes two lines that spring in `stagger` beats apart
- `lower` lower third, the rule wiping out from the left under the label, with
  an optional kicker ahead of it
- `list` two columns of items, each landing on its own half beat down the
  left column and then the right, over a scrim
- `stamp` corner tag with no easing at all, which is what makes it read as
  locked to the drum rather than animated
- `bumper` end card, the `LogoFull` wordmark from `@pmndrs/branding` with the
  signup url landing a beat later

Type is Geist and Geist Mono from the brand system, loaded from `public/fonts`
through `@remotion/fonts` so a render never depends on the network. Colours
come from `src/brand.ts`: dark-900 is the ground, light-25 the type, teal the
one accent.

`@pmndrs/branding` ships a Babel 7 build that imports `@babel/runtime` without
declaring it, so this project pins `@babel/runtime@^7` directly. Version 8 drops
the `helpers/esm/*` export paths that build needs.

`src/components/chrome.tsx` holds the full length furniture: the cut flash on
every shot change and card edge, edge scrims, vignette and grain.

## Format notes

The source is 2048x1556 at 50fps with roughly 16:9 content letterboxed inside
it on most shots. Compositions run at 50fps so every frame maps to one source
frame.

The delivery crops to 16:9, which lands close to those baked in bars. Cues are
authored against a fixed 1920x1080 design frame that is scaled to the delivery,
so the layout is resolution independent.
