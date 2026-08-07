import { World } from 'koota';
import { BoundingBox, Ground, Position, Velocity } from '../traits';

export function resolveGroundCollision(world: World) {
  const ground = world.queryFirst(Ground, Position);
  if (!ground) return;

  const groundPosition = ground.get(Position)!;

  world.query(Position, Velocity, BoundingBox).updateEach(([position, velocity, boundingBox]) => {
    const halfHeight = boundingBox.height / 2;
    const bottom = position.y - halfHeight;

    if (bottom >= groundPosition.y) return;

    position.y = groundPosition.y + halfHeight;
    if (velocity.y < 0) velocity.y = 0;
  });
}
