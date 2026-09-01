import type { BlockKindName } from './traits';

// Hits with a tool before the block breaks. Zero means the block cannot be mined.
export const HITS_TO_BREAK: Record<BlockKindName, number> = {
  leaves: 1,
  snow: 2,
  grass: 3,
  dirt: 3,
  sand: 3,
  log: 4,
  stone: 6,
  water: 0,
};

export const BLOCK_KINDS = Object.keys(HITS_TO_BREAK) as BlockKindName[];

// Solid blocks collide, cast shadows, and take hits.
export const isSolidBlock = (kind: BlockKindName) => kind !== 'water';
