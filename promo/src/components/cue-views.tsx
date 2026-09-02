// The cue treatments. Each one is rendered inside a Sequence that starts
// on its beat, so useCurrentFrame is already relative to the cue and a spring
// seeded at frame 0 lands its attack exactly on the beat.

import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { LogoFull } from '@pmndrs/branding';
import { beatsToFrames } from '../beat';
import { brand } from '../brand';
import { geist, geistMono } from '../fonts';
import { measureText } from '@remotion/layout-utils';
import type { Cue } from '../cues';

// One family for everything. Titles take the black weight so the poster
// measure still carries at size, lower thirds and cards sit at bold.
const display = geist;
const displayWeight = 900;
const displayTracking = '-0.03em';
const sans = geist;
const mono = geistMono;

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
          color: brand.light25,
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

// Chapter card. One line on the dark ground, centred, an optional line under
// it, and nothing moves. It cuts in on its beat and cuts out on its last one,
// and the footage on either side is what makes it land. With a `lead` the card
// becomes two lines in the same size and weight that spring in `stagger` beats
// apart, the lead first. The plate overshoots the design frame so the card
// covers the whole delivery.
function Card({ text, lead, sub, stagger = 0 }: Extract<Cue, { kind: 'card' }>) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: -2000,
        background: brand.dark900,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 22,
      }}
    >
      {lead ? <CardLine text={lead} size={88} weight={700} delay={0} /> : null}
      <CardLine text={text} size={88} weight={700} delay={lead ? stagger : undefined} />
      {sub ? (
        <span
          style={{
            fontFamily: mono,
            fontSize: 36,
            letterSpacing: '0.1em',
            color: brand.light,
            opacity: 0.7,
            whiteSpace: 'nowrap',
          }}
        >
          {sub}
        </span>
      ) : null}
    </div>
  );
}

// A card line. Given a delay it rises into place on the entry spring, otherwise
// it is simply there.
function CardLine({
  text,
  size,
  weight,
  delay,
}: {
  text: string;
  size: number;
  weight: number;
  delay?: number;
}) {
  const entry = delay === undefined ? 1 : useEntry(delay);
  return (
    <span
      style={{
        fontFamily: sans,
        fontWeight: weight,
        fontSize: size,
        letterSpacing: '-0.02em',
        color: brand.light25,
        whiteSpace: 'nowrap',
        opacity: entry,
        transform: `translateY(${(1 - entry) * 36}px)`,
      }}
    >
      {text}
    </span>
  );
}

// Two columns of items, each landing on its own half beat down the left column
// and then the right, under a scrim heavy enough that the footage behind reads
// as texture rather than subject.
function List({ items, every = 0.5, hold }: Extract<Cue, { kind: 'list' }>) {
  const scrim = useEntry();
  const release = useRelease(hold);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: release }}>
      <div
        style={{
          position: 'absolute',
          inset: -2000,
          background: 'rgba(0,0,0,0.72)',
          opacity: scrim,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '0 140px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: `repeat(${Math.ceil(items.length / 2)}, auto)`,
          gridAutoFlow: 'column',
          columnGap: 80,
          rowGap: 26,
          alignContent: 'center',
        }}
      >
        {items.map((item, index) => (
          <ListItem key={item} text={item} delay={index * every} />
        ))}
      </div>
    </div>
  );
}

function ListItem({ text, delay }: { text: string; delay: number }) {
  const entry = useEntry(delay);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 26,
        opacity: entry,
        transform: `translateX(${(1 - entry) * -40}px)`,
      }}
    >
      <span style={{ width: 18, height: 18, background: brand.teal, flexShrink: 0 }} />
      <span
        style={{
          fontFamily: sans,
          fontWeight: 700,
          fontSize: 50,
          letterSpacing: '-0.02em',
          color: brand.light25,
          whiteSpace: 'nowrap',
          textShadow: '0 6px 40px rgba(0,0,0,0.6)',
        }}
      >
        {text}
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
        color: brand.teal,
        opacity: entry,
        transform: `translateY(${(1 - entry) * 20}px)`,
      }}
    >
      {text}
    </span>
  );
}

// Lower third. The kicker is optional now that a card names the chapter, and
// without it the rule still wipes out under the label from the left.
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
      {kicker ? (
        <span
          style={{
            fontFamily: mono,
            fontSize: 34,
            color: brand.teal,
            opacity: entry,
            transform: `translateX(${(1 - entry) * -30}px)`,
          }}
        >
          {kicker}
        </span>
      ) : null}
      {/* The rule wipes out from the kicker and the label rides behind it */}
      <div style={{ overflow: 'hidden', paddingBottom: 8 }}>
        <span
          style={{
            display: 'inline-block',
            fontFamily: sans,
            fontWeight: 700,
            fontSize: 66,
            letterSpacing: '-0.02em',
            color: brand.light25,
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
          background: brand.teal,
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
        color: brand.light25,
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
      {/* Overshoots the design frame so the end card dims the whole delivery */}
      <div
        style={{
          position: 'absolute',
          inset: -2000,
          background: 'rgba(0,0,0,0.55)',
          opacity: entry,
        }}
      />
      <LogoFull
        color={brand.light25}
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
  if (cue.kind === 'lower') return <LowerThird {...cue} />;
  if (cue.kind === 'card') return <Card {...cue} />;
  if (cue.kind === 'list') return <List {...cue} />;
  if (cue.kind === 'bumper') return <Bumper {...cue} />;
  return <Stamp {...cue} />;
}
