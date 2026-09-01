import type { World } from 'koota';
import { Vector3 } from 'three';
import { HITS_TO_BREAK, isSolidBlock } from '../blocks';
import {
  Block,
  BlockDamage,
  BlockKind,
  Blocks,
  BoxCollider,
  Construction,
  Position,
  Reveal,
  Terrain,
  Time,
} from '../traits';

// Seconds ahead of its cue a block is spawned or an old block removed.
const LOOKAHEAD = 0.1;

// Spawns and clears every block whose cue falls within the lookahead. Returns whether any work is
// left.
export function buildWorld(world: World) {
  const job = world.get(Construction)!;
  const grid = world.get(Blocks)!;
  const due = job.elapsed + LOOKAHEAD;

  // Old blocks go first so the new ones find their cells free.
  while (job.nextDoomed < job.doomed.length && job.doomed[job.nextDoomed].delay <= due) {
    const { entity } = job.doomed[job.nextDoomed++];
    if (world.has(entity)) entity.destroy();
  }

  while (job.nextPending < job.pending.length && job.pending[job.nextPending].delay <= due) {
    const { x, y, z, kind, delay } = job.pending[job.nextPending++];
    // Hand-placed blocks stay, and the terrain flows around them.
    if (grid.at(x, Math.floor(y), z)) continue;

    const solid = isSolidBlock(kind)
      ? [BoxCollider, BlockDamage({ hitsToBreak: HITS_TO_BREAK[kind] })]
      : [];
    world.spawn(
      Block,
      Terrain,
      BlockKind({ kind }),
      Position(new Vector3(x, y, z)),
      Reveal({ delay, elapsed: job.elapsed }),
      ...solid
    );
  }

  return job.nextDoomed < job.doomed.length || job.nextPending < job.pending.length;
}

export function updateConstruction(world: World) {
  const job = world.get(Construction)!;
  if (job.nextDoomed >= job.doomed.length && job.nextPending >= job.pending.length) return;

  job.elapsed += world.get(Time)!.delta;
  buildWorld(world);
}
