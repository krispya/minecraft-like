import { Not, type World } from 'koota';
import { BoxCollider, IsGrounded, Position, Velocity } from '../traits';

export function resolveBoxCollisions(world: World) {
  const staticBoxes = world.query(Position, BoxCollider, Not(Velocity)).select(Position, BoxCollider);

  world
    .query(Position, Velocity, BoxCollider)
    .select(Position, Velocity, BoxCollider)
    .updateEach(([position, velocity, box], entity) => {
      let isGrounded = entity.has(IsGrounded);

      staticBoxes.readEach(([staticPosition, staticBox]) => {
        const deltaX = position.x - staticPosition.x;
        const deltaY = position.y - staticPosition.y;
        const deltaZ = position.z - staticPosition.z;
        const overlapX = (box.size.x + staticBox.size.x) / 2 - Math.abs(deltaX);
        const overlapY = (box.size.y + staticBox.size.y) / 2 - Math.abs(deltaY);
        const overlapZ = (box.size.z + staticBox.size.z) / 2 - Math.abs(deltaZ);

        if (overlapX < 0 || overlapY < 0 || overlapZ < 0) return;

        if (overlapY <= overlapX && overlapY <= overlapZ) {
          const direction = deltaY < 0 ? -1 : 1;
          position.y += overlapY * direction;
          if (velocity.y * direction < 0) velocity.y = 0;
          if (direction > 0) isGrounded = true;
        } else if (overlapX <= overlapZ) {
          const direction = deltaX < 0 ? -1 : 1;
          position.x += overlapX * direction;
          if (velocity.x * direction < 0) velocity.x = 0;
        } else {
          const direction = deltaZ < 0 ? -1 : 1;
          position.z += overlapZ * direction;
          if (velocity.z * direction < 0) velocity.z = 0;
        }
      });

      if (isGrounded) entity.add(IsGrounded);
    });
}
