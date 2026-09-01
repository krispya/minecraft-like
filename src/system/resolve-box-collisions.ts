import { Not, type World } from 'koota';
import { BoxCollider, IsGrounded, IsRiding, Position, Velocity } from '../traits';

export function resolveBoxCollisions(world: World) {
  const colliders = world.query(Position, BoxCollider, Not(IsRiding));

  world
    .query(Position, Velocity, BoxCollider)
    .select(Position, Velocity, BoxCollider)
    .updateEach(([position, velocity, box], entity) => {
      let isGrounded = entity.has(IsGrounded);

      colliders.forEach((other) => {
        if (other === entity) return;

        const otherPosition = other.get(Position)!;
        const otherBox = other.get(BoxCollider)!;
        const otherVelocity = other.get(Velocity);

        const deltaX = position.x - otherPosition.x;
        const deltaY = position.y - otherPosition.y;
        const deltaZ = position.z - otherPosition.z;
        const overlapX = (box.size.x + otherBox.size.x) / 2 - Math.abs(deltaX);
        const overlapY = (box.size.y + otherBox.size.y) / 2 - Math.abs(deltaY);
        const overlapZ = (box.size.z + otherBox.size.z) / 2 - Math.abs(deltaZ);

        if (overlapX < 0 || overlapY < 0 || overlapZ < 0) return;

        if (overlapY <= overlapX && overlapY <= overlapZ) {
          const direction = deltaY < 0 ? -1 : 1;
          // The body underneath resolves the overlap on its own turn, so only the body on top moves.
          if (direction < 0 && otherVelocity) return;

          position.y += overlapY * direction;
          if (velocity.y * direction < 0) velocity.y = 0;
          if (direction > 0) isGrounded = true;
          return;
        }

        // Two moving bodies split the horizontal correction; a static body takes none.
        const share = otherVelocity ? 0.5 : 1;

        if (overlapX <= overlapZ) {
          const direction = deltaX < 0 ? -1 : 1;
          position.x += overlapX * share * direction;
          if (velocity.x * direction < 0) velocity.x = 0;

          if (otherVelocity) {
            otherPosition.x -= overlapX * share * direction;
            if (otherVelocity.x * direction > 0) otherVelocity.x = 0;
          }
        } else {
          const direction = deltaZ < 0 ? -1 : 1;
          position.z += overlapZ * share * direction;
          if (velocity.z * direction < 0) velocity.z = 0;

          if (otherVelocity) {
            otherPosition.z -= overlapZ * share * direction;
            if (otherVelocity.z * direction > 0) otherVelocity.z = 0;
          }
        }
      });

      if (isGrounded) entity.add(IsGrounded);
    });
}
