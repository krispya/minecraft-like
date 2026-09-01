import type { Entity } from 'koota';
import { useTrait } from 'koota/react';
import { MathUtils } from 'three';
import { Item, type ItemKind } from '../traits';
import { FirstPersonBlock, ThirdPersonBlock } from './block-item';
import { FirstPersonHammer, ThirdPersonHammer } from './hammer';

export type ItemDisplay = 'firstPerson' | 'thirdPerson';

const DEG = MathUtils.DEG2RAD;

type Display = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
};

// Minecraft's `firstperson_righthand` displays: a handheld item lies along the hand, a block sits
// in it corner-first.
const FIRST_PERSON_DISPLAY: Record<ItemKind, Display> = {
  hammer: {
    position: [1.13 / 16, 3.2 / 16, 1.13 / 16],
    rotation: [0, -90 * DEG, 25 * DEG],
    scale: 0.68,
  },
  block: { position: [0, 0, 0], rotation: [0, 45 * DEG, 0], scale: 0.4 },
};

// Picks the model for an item's kind, posed for the view it is shown in.
export function ItemView({ item, display }: { item: Entity; display: ItemDisplay }) {
  const kind = useTrait(item, Item)?.kind;
  if (!kind) return null;

  if (display === 'firstPerson') {
    return (
      <group {...FIRST_PERSON_DISPLAY[kind]}>
        <FirstPersonItem kind={kind} />
      </group>
    );
  }

  return <ThirdPersonItem kind={kind} />;
}

function FirstPersonItem({ kind }: { kind: ItemKind }) {
  switch (kind) {
    case 'hammer':
      return <FirstPersonHammer />;
    case 'block':
      return <FirstPersonBlock />;
  }
}

function ThirdPersonItem({ kind }: { kind: ItemKind }) {
  switch (kind) {
    case 'hammer':
      return <ThirdPersonHammer />;
    case 'block':
      return <ThirdPersonBlock />;
  }
}
