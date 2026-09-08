import { createActions } from 'koota';
import type { Vector3 } from 'three';
import { BoxCollider, Velocity } from '../physics/traits';
import { Position } from '../transform';
import { Block, BlockDamage, BlockKind, Blocks } from './traits';

export const blockActions = createActions((world) => ({
  spawnBlockAt: (position: Vector3) => {
    const snappedPosition = position
      .clone()
      .set(Math.round(position.x), Math.round(position.y - 0.5) + 0.5, Math.round(position.z));

    if (world.get(Blocks)!.isOccupied(snappedPosition)) return;

    // Blocks cannot be placed inside any moving body, like the player or a mob.
    const intersectsBody = world.query(Velocity, Position, BoxCollider).some((body) => {
      const bodyPosition = body.get(Position)!;
      const collider = body.get(BoxCollider)!;

      return (
        Math.abs(bodyPosition.x - snappedPosition.x) < (collider.size.x + 1) / 2 &&
        Math.abs(bodyPosition.y - snappedPosition.y) < (collider.size.y + 1) / 2 &&
        Math.abs(bodyPosition.z - snappedPosition.z) < (collider.size.z + 1) / 2
      );
    });
    if (intersectsBody) return;

    return world.spawn(Block, BlockKind, BlockDamage, Position(snappedPosition), BoxCollider);
  },
}));
