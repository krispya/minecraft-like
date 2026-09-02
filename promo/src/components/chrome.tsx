import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { cutBeats, useBeatPosition } from '../beat';

// Flashes at footage cuts and card boundaries.
export function CutFlash() {
  const position = useBeatPosition();
  const nearest = cutBeats.reduce(
    (closest, beat) => (Math.abs(beat - position) < Math.abs(closest - position) ? beat : closest),
    -Infinity
  );
  return (
    <AbsoluteFill
      style={{
        background: 'white',
        mixBlendMode: 'overlay',
        opacity: interpolate(position - nearest, [0, 0.25], [0.35, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }),
      }}
    />
  );
}

// Darkens the top and bottom edges for UI and lower-third contrast.
export function EdgeScrims() {
  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '22%',
          background: 'linear-gradient(rgba(0,0,0,0.62), rgba(0,0,0,0))',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '34%',
          background: 'linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0.72))',
        }}
      />
    </>
  );
}

export function Vignette() {
  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(115% 78% at 50% 42%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.62) 100%)',
      }}
    />
  );
}

// Reuses each noise seed for two frames to limit crawl and render cost.
export function Grain() {
  const seed = Math.floor(useCurrentFrame() / 2);
  return (
    <AbsoluteFill style={{ opacity: 0.06, mixBlendMode: 'overlay' }}>
      <svg width="100%" height="100%">
        <filter id={`grain-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={1} seed={seed} />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${seed})`} />
      </svg>
    </AbsoluteFill>
  );
}
