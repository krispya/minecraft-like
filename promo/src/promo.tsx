import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { beatToFrame, beatsToFrames, useBeatPulse } from './beat';
import { cues } from './cues';
import { CueView } from './components/cue-views';
import { CutFlash, EdgeScrims, Grain, Vignette } from './components/chrome';

// Crops the 2048x1556 source to 16:9, which lands close to the black bars
// already baked into most shots. Cues are authored against a 1920 wide design
// frame and scaled to the delivery.
export function Promo() {
  const { fps, width } = useVideoConfig();

  // 1.03 base crops past the letterbox baked into the source, then every
  // downbeat pushes in a little further. Kept under 2% because past that it
  // stops reading as emphasis and starts reading as a zoom.
  const punch = 1.03 + 0.018 * useBeatPulse(4, 4);

  return (
    <AbsoluteFill style={{ background: 'black' }}>
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        <OffthreadVideo
          src={staticFile('track_promo.mp4')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `scale(${punch})`,
          }}
        />
        <Vignette />
        <EdgeScrims />
        <CutFlash />
      </AbsoluteFill>

      <div style={{ position: 'absolute', inset: 0, transform: `scale(${width / 1920})` }}>
        {cues.map((cue, index) => (
          <Sequence
            key={index}
            from={beatToFrame(cue.at, fps)}
            durationInFrames={beatsToFrames(cue.hold, fps)}
            layout="none"
          >
            <CueView cue={cue} />
          </Sequence>
        ))}
      </div>

      <Grain />
      <Fade />
    </AbsoluteFill>
  );
}

// Black at both ends so the piece can loop or sit in a feed without a hard start
function Fade() {
  const { durationInFrames, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background: 'black',
        pointerEvents: 'none',
        opacity: interpolate(
          frame,
          [0, beatsToFrames(0.5, fps), durationInFrames - beatsToFrames(1, fps), durationInFrames],
          [1, 0, 0, 1],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        ),
      }}
    />
  );
}
