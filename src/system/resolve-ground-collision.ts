import { World } from 'koota';
import { BoundingBox, Ground, IsGrounded, Physical, Position, Velocity } from '../traits';

export function resolveGroundCollision(world: World) {
  const groundPosition = world.queryFirst(Ground, Position)?.get(Position);

  world
    .query(Physical, Position, Velocity, BoundingBox)
    .select(Position, Velocity, BoundingBox)
    .updateEach(([position, velocity, boundingBox], entity) => {
      const halfHeight = boundingBox.height / 2;
      const bottom = position.y - halfHeight;
      const isGrounded = groundPosition !== undefined && bottom <= groundPosition.y;

      if (!isGrounded) {
        entity.remove(IsGrounded);
        return;
      }

      entity.add(IsGrounded);

      if (bottom < groundPosition.y) position.y = groundPosition.y + halfHeight;
      if (velocity.y < 0) velocity.y = 0;
    });
}
