import type { Entity } from 'koota';
import { useTrait } from 'koota/react';
import { Item } from '../traits';
import { FirstPersonHammer, ThirdPersonHammer } from './hammer';

export type ItemDisplay = 'firstPerson' | 'thirdPerson';

// Picks the model for an item's kind, posed for the view it is shown in.
export function ItemView({ item, display }: { item: Entity; display: ItemDisplay }) {
  const kind = useTrait(item, Item)?.kind;

  switch (kind) {
    case 'hammer':
      return display === 'firstPerson' ? <FirstPersonHammer /> : <ThirdPersonHammer />;
    default:
      return null;
  }
}
