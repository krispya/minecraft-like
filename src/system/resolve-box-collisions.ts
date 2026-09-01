import { Not, type World } from 'koota';
import type { Vector3 } from 'three';
import { Block, Blocks, BoxCollider, IsGrounded, IsRiding, Position, Velocity } from '../traits';

// Pushes the body out of the other box along the axis of least overlap. Returns whether the body
// ended up standing on the other box.
function resolveOverlap(
  position: Vector3,
  velocity: Vector3,
  size: Vector3,
  otherPosition: Vector3,
  otherSize: Vector3,
  otherVelocity?: Vector3
) {
  const deltaX = position.x - otherPosition.x;
  const deltaY = position.y - otherPosition.y;
  const deltaZ = position.z - otherPosition.z;
  const overlapX = (size.x + otherSize.x) / 2 - Math.abs(deltaX);
  const overlapY = (size.y + otherSize.y) / 2 - Math.abs(deltaY);
  const overlapZ = (size.z + otherSize.z) / 2 - Math.abs(deltaZ);

  if (overlapX < 0 || overlapY < 0 || overlapZ < 0) return false;

  if (overlapY <= overlapX && overlapY <= overlapZ) {
    const direction = deltaY < 0 ? -1 : 1;
    // The body underneath resolves the overlap on its own turn, so only the body on top moves.
    if (direction < 0 && otherVelocity) return false;

    position.y += overlapY * direction;
    if (velocity.y * direction < 0) velocity.y = 0;
    return direction > 0;
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

  return false;
}

export function resolveBoxCollisions(world: World) {
  const grid = world.get(Blocks)!;
  // Blocks are looked up from the grid around each body rather than scanned every frame.
  const colliders = world.query(Position, BoxCollider, Not(IsRiding), Not(Block));

  world
    .query(Position, Velocity, BoxCollider)
    .select(Position, Velocity, BoxCollider)
    .updateEach(([position, velocity, box], entity) => {
      let isGrounded = entity.has(IsGrounded);

      // Every cell the body's box could touch, padded by one so touching counts.
      const minX = Math.floor(position.x - box.size.x / 2) - 1;
      const maxX = Math.ceil(position.x + box.size.x / 2) + 1;
      const minY = Math.floor(position.y - box.size.y / 2) - 1;
      const maxY = Math.ceil(position.y + box.size.y / 2) + 1;
      const minZ = Math.floor(position.z - box.size.z / 2) - 1;
      const maxZ = Math.ceil(position.z + box.size.z / 2) + 1;

      for (let cx = minX; cx <= maxX; cx++) {
        for (let cy = minY; cy <= maxY; cy++) {
          for (let cz = minZ; cz <= maxZ; cz++) {
            const block = grid.at(cx, cy, cz);
            const blockBox = block?.get(BoxCollider);
            if (!block || !blockBox) continue;

            const landed = resolveOverlap(
              position,
              velocity,
              box.size,
              block.get(Position)!,
              blockBox.size
            );
            if (landed) isGrounded = true;
          }
        }
      }

      colliders.forEach((other) => {
        if (other === entity) return;

        const landed = resolveOverlap(
          position,
          velocity,
          box.size,
          other.get(Position)!,
          other.get(BoxCollider)!.size,
          other.get(Velocity)
        );
        if (landed) isGrounded = true;
      });

      if (isGrounded) entity.add(IsGrounded);
    });
}
