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
import { BeatBar, CutFlash, EdgeScrims, Grain, Vignette } from './components/chrome';

// Landscape crops the 2048x1556 source to 16:9, which lands close to the black
// bars already baked into most shots.
//
// Vertical cannot crop that far without losing the subject, so it runs the
// footage as a tall block over a blurred copy of itself and drops the type into
// the space below it. Both formats share one set of cues, authored against a
// 1920 wide frame and scaled to fit.
export function Promo({ format }: { format: 'landscape' | 'vertical' }) {
  const { fps, width, height } = useVideoConfig();
  const vertical = format === 'vertical';

  // 1.03 base crops past the letterbox baked into the source, then every
  // downbeat pushes in a little further. Kept under 2% because past that it
  // stops reading as emphasis and starts reading as a zoom.
  const punch = 1.03 + 0.018 * useBeatPulse(4, 4);

  // The footage block stays 16:9 in both formats. Anything taller re-exposes
  // the letterbox baked into the game shots, since cropping a 9:16 block from
  // a 4:3 source only ever takes width away.
  const block = vertical ? { top: 300, height: Math.round(width / (16 / 9)) } : { top: 0, height };
  const typeCentre = vertical ? (block.top + block.height + height) / 2 : height / 2;

  return (
    <AbsoluteFill style={{ background: 'black' }}>
      {vertical && (
        <OffthreadVideo
          src={staticFile('track_promo.mp4')}
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(70px) saturate(1.5) brightness(0.4)',
            transform: 'scale(1.25)',
          }}
        />
      )}

      <div
        style={{
          position: 'absolute',
          top: block.top,
          left: 0,
          width: '100%',
          height: block.height,
          overflow: 'hidden',
        }}
      >
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
      </div>

      {/* A fixed 1920x1080 design frame, centred and scaled to the format, so
			    a cue placed at bottom left lands in the same place in both */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: typeCentre,
          width: 1920,
          height: 1080,
          marginLeft: -960,
          marginTop: -540,
          transform: `scale(${width / 1920})`,
        }}
      >
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
        <BeatBar />
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
