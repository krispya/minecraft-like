import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { LogoFull } from '@pmndrs/branding';
import { beatsToFrames } from '../beat';
import { brand } from '../brand';
import { geist, geistMono } from '../fonts';
import { measureText } from '@remotion/layout-utils';
import type { Cue } from '../cues';

// Cue components render inside a Sequence, so their current frame starts at zero.
const display = geist;
const displayWeight = 900;
const displayTracking = '-0.03em';
const sans = geist;
const mono = geistMono;

function useEntry(delayInBeats = 0) {
  const { fps } = useVideoConfig();
  return spring({
    frame: useCurrentFrame() - beatsToFrames(delayInBeats, fps),
    fps,
    config: { damping: 14, mass: 0.35, stiffness: 190 },
  });
}

// Fades a cue during its final half beat.
function useRelease(hold: number) {
  const { fps } = useVideoConfig();
  const end = beatsToFrames(hold, fps);
  return interpolate(useCurrentFrame(), [end - beatsToFrames(0.5, fps), end], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

// Scales each line to a shared width for a poster-style text block.
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

function Line({ text, delay }: { text: string; delay: number }) {
  const entry = useEntry(delay);
  const natural = measureText({
    text,
    fontFamily: display,
    fontSize: 100,
    fontWeight: displayWeight,
    letterSpacing: displayTracking,
  });
  // Fit the line to a 1150 px measure and cap very short lines.
  const size = Math.min((100 * 1150) / natural.width, 250);
  // Prevent the wipe mask from clipping the text shadow.
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
          transform: `translateY(${(1 - entry) * 145}%)`,
        }}
      >
        {text}
      </span>
    </span>
  );
}

// A lead creates two staggered lines. The oversized plate covers scaled deliveries.
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

// Fills the left column before the right and staggers items by `every` beats.
function List({ items, every = 0.5, hold }: Extract<Cue, { kind: 'list' }>) {
  const release = useRelease(hold);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* The plate stays at full through the cut. Only the items release. */}
      <div
        style={{
          position: 'absolute',
          inset: -2000,
          background: 'rgba(0,0,0,0.72)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: release,
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
          // Tracks the combined kicker and label width.
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
  // Hide frame 2 to create a one-frame flicker.
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
        textShadow: '0 2px 20px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.7)',
        opacity: release,
      }}
    >
      {text}
    </span>
  );
}

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
