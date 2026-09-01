import type { World } from 'koota';
import { Follows, OrbitController, Position } from '../traits';

export function updateFollowTarget(world: World) {
  world
    .query(Follows('*'), OrbitController)
    .select(OrbitController)
    .updateEach(([controller], entity) => {
      const targetPosition = entity.targetFor(Follows)?.get(Position);

      if (targetPosition) controller.target.copy(targetPosition);
    });
}
