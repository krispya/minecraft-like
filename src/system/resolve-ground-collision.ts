import { World } from 'koota';
import { Ground, Position, Velocity } from '../traits';

export function resolveGroundCollision(world: World) {
  const ground = world.queryFirst(Ground, Position);
  if (!ground) return;

  const groundPosition = ground.get(Position)!;

  world.query(Position, Velocity).updateEach(([position, velocity]) => {
    if (position.y >= groundPosition.y) return;

    position.y = groundPosition.y;
    if (velocity.y < 0) velocity.y = 0;
  });
}
