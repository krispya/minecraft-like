import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { beatsToFrames, songStart, useBeatPulse } from './beat';
import { brand } from './brand';
import { cues, footage, song } from './cues';
import { CueView } from './components/cue-views';
import { CutFlash, EdgeScrims, Grain, Vignette } from './components/chrome';

// Source footage is cropped to 16:9. Cue layouts use a 1920 px design frame.
export function Promo() {
  const { fps, width, durationInFrames } = useVideoConfig();

  // Clears baked letterboxing and adds a beat-synchronized push.
  const punch = 1.03 + 0.018 * useBeatPulse(4, 4);

  return (
    <AbsoluteFill style={{ background: brand.dark900 }}>
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        {footage.map(({ at, shots, src = 'track_promo.mp4', rate = 1, fade = 0 }) => {
          // Chain shots in frames to avoid gaps from beat rounding.
          let from = beatsToFrames(at, fps);
          return shots.map(([start, end], index) => {
            const duration = Math.round(((end - start) / rate) * fps);
            const sequence = (
              <Sequence key={`${start}-${end}`} from={from} durationInFrames={duration}>
                <Shot
                  src={src}
                  start={start}
                  end={end}
                  rate={rate}
                  punch={punch}
                  fade={index === shots.length - 1 ? beatsToFrames(fade, fps) : 0}
                />
              </Sequence>
            );
            from += duration;
            return sequence;
          });
        })}
        <Vignette />
        <EdgeScrims />
        <CutFlash />
      </AbsoluteFill>

      <div style={{ position: 'absolute', inset: 0, transform: `scale(${width / 1920})` }}>
        {cues.map((cue, index) => (
          <Sequence
            key={index}
            from={beatsToFrames(cue.at, fps)}
            durationInFrames={beatsToFrames(cue.hold, fps)}
            layout="none"
          >
            <CueView cue={cue} />
          </Sequence>
        ))}
      </div>

      <Grain />
      <Fade />
      <Audio
        src={staticFile(song.file)}
        startFrom={Math.round(songStart * fps)}
        volume={(frame) =>
          interpolate(
            frame,
            [durationInFrames - beatsToFrames(song.fadeOut, fps), durationInFrames],
            [1, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          )
        }
      />
    </AbsoluteFill>
  );
}

// `fade` is the number of frames used to fade the shot to the background.
function Shot({
  src,
  start,
  end,
  rate,
  punch,
  fade,
}: {
  src: string;
  start: number;
  end: number;
  rate: number;
  punch: number;
  fade: number;
}) {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const duration = Math.round(((end - start) / rate) * fps);
  return (
    <OffthreadVideo
      src={staticFile(src)}
      startFrom={Math.round(start * fps)}
      endAt={Math.round(end * fps)}
      playbackRate={rate}
      muted
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: `scale(${punch})`,
        opacity: fade
          ? interpolate(frame, [duration - fade, duration], [1, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })
          : 1,
      }}
    />
  );
}

// Fades the picture during the final `song.fadeOut` beats.
function Fade() {
  const { durationInFrames, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background: brand.dark900,
        pointerEvents: 'none',
        opacity: interpolate(
          frame,
          [durationInFrames - beatsToFrames(song.fadeOut, fps), durationInFrames],
          [0, 1],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        ),
      }}
    />
  );
}
