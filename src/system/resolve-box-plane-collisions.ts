import type { World } from 'koota';
import { BoxCollider, IsGrounded, PlaneCollider, Position, Velocity } from '../traits';

const MIN_GROUND_NORMAL_Y = Math.SQRT1_2;

export function resolveBoxPlaneCollisions(world: World) {
  const planes = world.query(PlaneCollider, Position);

  world.query(Position, Velocity, BoxCollider).updateEach(([position, velocity, box], entity) => {
    let isGrounded = false;

    planes.readEach(([plane, planePosition]) => {
      const normalLength = plane.normal.length();
      if (normalLength === 0) return;

      const normalX = plane.normal.x / normalLength;
      const normalY = plane.normal.y / normalLength;
      const normalZ = plane.normal.z / normalLength;
      const extent =
        (Math.abs(normalX) * box.size.x +
          Math.abs(normalY) * box.size.y +
          Math.abs(normalZ) * box.size.z) /
        2;
      const distance =
        (position.x - planePosition.x) * normalX +
        (position.y - planePosition.y) * normalY +
        (position.z - planePosition.z) * normalZ -
        extent;

      if (distance > 0) return;

      position.x -= normalX * distance;
      position.y -= normalY * distance;
      position.z -= normalZ * distance;

      const normalVelocity = velocity.x * normalX + velocity.y * normalY + velocity.z * normalZ;

      if (normalVelocity < 0) {
        velocity.x -= normalX * normalVelocity;
        velocity.y -= normalY * normalVelocity;
        velocity.z -= normalZ * normalVelocity;
      }

      if (normalY >= MIN_GROUND_NORMAL_Y) isGrounded = true;
    });

    if (isGrounded) entity.add(IsGrounded);
    else entity.remove(IsGrounded);
  });
}
