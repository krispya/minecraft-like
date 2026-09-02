// The four cue treatments. Each one is rendered inside a Sequence that starts
// on its beat, so useCurrentFrame is already relative to the cue and a spring
// seeded at frame 0 lands its attack exactly on the beat.

import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadMono } from '@remotion/google-fonts/JetBrainsMono';
import { loadFont as loadDisplay } from '@remotion/google-fonts/Anton';
import { LogoFull } from '@pmndrs/branding';
import { beatsToFrames } from '../beat';
import { measureText } from '@remotion/layout-utils';
import type { Cue } from '../cues';

// Only the weights and subset actually used, otherwise each render pulls the
// entire family over the network before the first frame
const inter = loadInter('normal', {
  weights: ['700'],
  subsets: ['latin'],
}).fontFamily;
// Display face for titles only. Kept separate from Inter so the headline can
// carry character at a heavy weight while the lower thirds stay neutral.
const display = loadDisplay('normal', {
  weights: ['400'],
  subsets: ['latin'],
}).fontFamily;
// Anton ships a single weight that is already heavy, so 400 is its black
const displayWeight = 400;
const displayTracking = '0em';
const mono = loadMono('normal', {
  weights: ['400'],
  subsets: ['latin'],
}).fontFamily;

// Snappy with a touch of overshoot. Slower than this and the hit reads late.
function useEntry(delayInBeats = 0) {
  const { fps } = useVideoConfig();
  return spring({
    frame: useCurrentFrame() - beatsToFrames(delayInBeats, fps),
    fps,
    config: { damping: 14, mass: 0.35, stiffness: 190 },
  });
}

// Cues cut in hard on the beat and release softly, which keeps the attack sharp
// while stopping the text from popping out mid shot.
function useRelease(hold: number) {
  const { fps } = useVideoConfig();
  const end = beatsToFrames(hold, fps);
  return interpolate(useCurrentFrame(), [end - beatsToFrames(0.5, fps), end], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

// Poster measure. Every line is set to whatever size makes it fill the same
// width, so a short line becomes a tall one and the stack reads as one block.
// That uniform measure is what separates a poster title from centred type.
function Title({ text, hold, stagger = 0.5 }: Extract<Cue, { kind: 'title' }>) {
  const entry = useEntry();
  const release = useRelease(hold);
  const lines = text.split(' / ');
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: release,
      }}
    >
      {/* Local scrim so the type survives the light configurator shots as
          well as the dark ones without needing per cue colour choices */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(58% 42% at 50% 50%, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0) 72%)',
          opacity: entry,
        }}
      />
      {lines.map((line, index) => (
        <Line key={line + index} text={line} delay={index * stagger} />
      ))}
    </div>
  );
}

// Each line rides up out of a clipped box. The line box keeps its full height
// so nothing crops the tops of the caps, and the stack is pulled tight with a
// negative margin instead of a short leading.
function Line({ text, delay }: { text: string; delay: number }) {
  const entry = useEntry(delay);
  const natural = measureText({
    text,
    fontFamily: display,
    fontSize: 100,
    fontWeight: displayWeight,
    letterSpacing: displayTracking,
  });
  // 1150 is the measure every line fills. Capped because a very short line like
  // a year would otherwise have to become enormous to fill the same width.
  const size = Math.min((100 * 1150) / natural.width, 250);
  // The wipe clips to this box, so it needs padding wide enough to hold the
  // text shadow, otherwise the shadow gets sliced off square at the edges.
  // Negative margins cancel the padding so the stack lands where it did.
  const bleed = 48;
  return (
    <span
      style={{
        display: 'block',
        overflow: 'hidden',
        padding: bleed,
        margin: `${-bleed}px ${-bleed}px ${-bleed - 0.2 * size}px`,
      }}
    >
      <span
        style={{
          display: 'block',
          fontFamily: display,
          fontWeight: displayWeight,
          fontSize: size,
          letterSpacing: displayTracking,
          lineHeight: 1.05,
          whiteSpace: 'nowrap',
          color: 'white',
          textShadow: '0 4px 28px rgba(0,0,0,0.4)',
          // Far enough to clear the padded box, not just its own height
          transform: `translateY(${(1 - entry) * 145}%)`,
        }}
      >
        {text}
      </span>
    </span>
  );
}

// Intro card. Each line of a right justified sentence gets its own block of
// colour, sized to that line and nudged off register so the type crosses the
// edges rather than sitting neatly inside.
//
// The timing follows the classic order rather than a single ease. A block winds
// up against its direction of travel, releases past its mark and settles, and
// its line of type arrives late on that settle so the two overlap. Before the
// exit each block stretches once more so leaving reads as a decision. Every
// stage is measured in beats, so the gesture stays locked to the track.
function Intro({ text, tag, hold, stagger = 0.5 }: Extract<Cue, { kind: 'intro' }>) {
  const lines = text.split(' / ');
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Shrinks to the widest line, so right aligning inside it keeps the
          whole block centred on screen rather than pinned to the edge */}
      <div style={{ textAlign: 'right' }}>
        {lines.map((line, index) => (
          <IntroLine key={line + index} text={line} delay={0.15 + index * stagger} hold={hold} />
        ))}
        {tag ? (
          <IntroLine text={tag} delay={0.15 + lines.length * stagger} hold={hold} size={56} />
        ) : null}
      </div>
    </div>
  );
}

function IntroLine({
  text,
  delay,
  hold,
  size = 110,
}: {
  text: string;
  delay: number;
  hold: number;
  size?: number;
}) {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const perBeat = beatsToFrames(1, fps);
  const beat = frame / perBeat;

  // Anticipation. A sliver appears and pulls back, so the sweep that follows
  // reads as stored force being released instead of a shape sliding in.
  const wind = interpolate(beat - delay, [0, 0.3], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out((t) => Easing.quad(t)),
  });
  // The sweep, springing past its mark and settling back onto it
  const sweep = spring({
    frame: frame - (delay + 0.3) * perBeat,
    fps,
    config: { damping: 11, mass: 0.4, stiffness: 220 },
  });
  // One edge that sweeps right and takes the block and its line with it, so a
  // block is never left sitting empty after its text has gone
  const out = interpolate(beat, [hold - 1, hold - 0.35], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in((t) => Easing.cubic(t)),
  });
  // The letters rise through a clipping plane rather than fading. The spring
  // carries them past the resting line and settles back down onto it, so the
  // move is up then down instead of a single arrival.
  const rise = spring({
    frame: frame - (delay + 0.35) * perBeat,
    fps,
    config: { damping: 10, mass: 0.5, stiffness: 190 },
  });
  // In on the left edge, out on the left edge again, so the block arrives from
  // the left and then leaves to the right rather than retreating
  const clip = `inset(0 ${Math.max(0, (1 - (0.1 * wind + 0.9 * sweep)) * 100)}% 0 ${out * 100}%)`;

  return (
    <div>
      <span style={{ position: 'relative', display: 'inline-block' }}>
        {/* Inset vertically and nudged down, so ascenders break the top edge
            and the block reads as printed slightly out of register */}
        <span
          style={{
            position: 'absolute',
            inset: `${size * 0.16}px -${size * 0.16}px`,
            background: 'rgba(0,0,0,0.65)',
            // The block never scales. It is revealed and cleared by the clip
            // alone, so the only motion is the anticipation pull before it
            // sweeps in.
            transform: `translate(${size * 0.1 - size * 0.1 * wind * (1 - sweep)}px, ${size * 0.09}px)`,
            clipPath: clip,
          }}
        />
        {/* Positioned so it paints over the block rather than under it. The
            bottom edge is the plane the letters rise through, while the top is
            opened up with padding so the overshoot is not cut off. */}
        <span
          style={{
            position: 'relative',
            display: 'block',
            overflow: 'hidden',
            paddingTop: size,
            marginTop: -size,
            // Same edge as the block, so the line and the shape behind it clear
            // the frame together
            clipPath: clip,
          }}
        >
          <span
            style={{
              display: 'block',
              fontFamily: display,
              fontWeight: displayWeight,
              fontSize: size,
              letterSpacing: displayTracking,
              lineHeight: 1.1,
              whiteSpace: 'nowrap',
              color: 'white',
              transform: `translateY(${(1 - rise) * 110}%)`,
            }}
          >
            {text}
          </span>
        </span>
      </span>
    </div>
  );
}

// The end card caption, centred under the wordmark
function Sub({ text, delay }: { text: string; delay: number }) {
  const entry = useEntry(delay);
  return (
    <span
      style={{
        fontFamily: mono,
        fontSize: 40,
        letterSpacing: '0.22em',
        marginTop: 28,
        color: '#7cf3c2',
        opacity: entry,
        transform: `translateY(${(1 - entry) * 20}px)`,
      }}
    >
      {text}
    </span>
  );
}

function LowerThird({ kicker, text, hold }: Extract<Cue, { kind: 'lower' }>) {
  const entry = useEntry();
  const release = useRelease(hold);
  return (
    <div
      style={{
        position: 'absolute',
        left: 110,
        bottom: 130,
        display: 'flex',
        alignItems: 'baseline',
        gap: 28,
        opacity: release,
      }}
    >
      <span
        style={{
          fontFamily: mono,
          fontSize: 34,
          color: '#7cf3c2',
          opacity: entry,
          transform: `translateX(${(1 - entry) * -30}px)`,
        }}
      >
        {kicker}
      </span>
      {/* The rule wipes out from the kicker and the label rides behind it */}
      <div style={{ overflow: 'hidden', paddingBottom: 8 }}>
        <span
          style={{
            display: 'inline-block',
            fontFamily: inter,
            fontWeight: 700,
            fontSize: 66,
            letterSpacing: '-0.02em',
            color: 'white',
            textShadow: '0 6px 40px rgba(0,0,0,0.6)',
            transform: `translateY(${(1 - entry) * 90}px)`,
          }}
        >
          {text}
        </span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          bottom: -18,
          height: 3,
          // Spans the kicker and label rather than a fixed length, so the rule
          // still fits when the copy changes
          width: `${100 * entry}%`,
          background: '#7cf3c2',
        }}
      />
    </div>
  );
}

function Stamp({ text, hold }: Extract<Cue, { kind: 'stamp' }>) {
  const frame = useCurrentFrame();
  const release = useRelease(hold);
  // No easing at all. A hard on/off with a one frame flicker reads as a cut
  // rather than an animation, which is what makes it feel locked to the drum.
  const visible = frame >= 0 && frame !== 2;
  return (
    <span
      style={{
        position: 'absolute',
        right: 110,
        top: 110,
        display: visible ? 'block' : 'none',
        fontFamily: mono,
        fontSize: 30,
        letterSpacing: '0.08em',
        color: 'white',
        // Carries its own legibility now that there is no plate behind it
        textShadow: '0 2px 20px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.7)',
        opacity: release,
      }}
    >
      {text}
    </span>
  );
}

// End bumper. The official wordmark from @pmndrs/branding rather than type set
// by hand, so it stays correct if the brand mark ever changes.
function Bumper({ url, hold }: Extract<Cue, { kind: 'bumper' }>) {
  const entry = useEntry();
  const release = useRelease(hold);
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: release,
      }}
    >
      {/* Overshoots the design frame so the end card dims the whole delivery,
          including the footage sitting above it in the vertical layout */}
      <div
        style={{
          position: 'absolute',
          inset: -2000,
          background: 'rgba(0,0,0,0.55)',
          opacity: entry,
        }}
      />
      <LogoFull
        color="white"
        style={{
          width: 820,
          opacity: entry,
          filter: `blur(${(1 - entry) * 10}px)`,
          transform: `scale(${interpolate(entry, [0, 1], [1.1, 1])})`,
        }}
      />
      {/* The call to action lands a beat after the mark rather than with it */}
      <Sub text={url} delay={1} />
    </div>
  );
}

export function CueView({ cue }: { cue: Cue }) {
  if (cue.kind === 'title') return <Title {...cue} />;
  if (cue.kind === 'intro') return <Intro {...cue} />;
  if (cue.kind === 'lower') return <LowerThird {...cue} />;
  if (cue.kind === 'bumper') return <Bumper {...cue} />;
  return <Stamp {...cue} />;
}
