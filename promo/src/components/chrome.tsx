// Frame furniture that runs for the whole piece. None of it carries meaning on
// its own, it exists so the cuts and the cues sit inside something deliberate.

import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { beatCount, cutBeats, useBeatPosition, useBeatPulse } from '../beat';

// A tick per beat with a bar that fills across the piece. The current beat
// brightens on its attack so the strip doubles as a metronome readout.
export function BeatBar() {
  const position = useBeatPosition();
  const pulse = useBeatPulse();
  return (
    <div
      style={{
        position: 'absolute',
        left: 110,
        right: 110,
        bottom: 64,
        display: 'flex',
        gap: 4,
        height: 6,
      }}
    >
      {Array.from({ length: beatCount }, (_, index) => (
        <div
          key={index}
          style={{
            flex: 1,
            background: 'white',
            opacity:
              index > position ? 0.16 : index === Math.floor(position) ? 0.4 + 0.6 * pulse : 0.55,
          }}
        />
      ))}
    </div>
  );
}

// Two frame lift on every detected cut. Small enough to feel like exposure
// rather than a transition.
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

// The 16:9 crop clips the source UI along the top edge on the configurator
// shots, and the lower third needs a base to sit on. One gradient at each edge
// solves both and reads as intent rather than repair.
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

// Reseeded every other frame. Every frame crawls too fast to read as film and
// costs more to rasterise for no visible gain.
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
