import type { World } from 'koota';
import { Block, Blocks, Position } from '../traits';
import { onAllAdded } from '../utils/on-all-added';

// Keeps the world's block grid mirroring block entities as they spawn and die.
export function subscribeBlockGrid(world: World) {
  const grid = world.get(Blocks)!;

  grid.clear();
  world.query(Block, Position).forEach((block) => grid.set(block, block.get(Position)!));

  const unsubscribe = [
    onAllAdded(world, [Block, Position], (block) => grid.set(block, block.get(Position)!)),
    world.onRemove(Block, (block) => grid.delete(block)),
  ];

  return () => unsubscribe.forEach((stop) => stop());
}
