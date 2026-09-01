import type { World } from 'koota';
import {
  BoundingBox,
  CharacterController,
  Ground,
  Input,
  IsGrounded,
  Position,
  Time,
  Velocity,
} from '../traits';

export function updateCharacterController(world: World) {
  const { delta } = world.get(Time)!;
  const groundPosition = world.queryFirst(Ground, Position)?.get(Position);

  world
    .query(CharacterController, Input, Position, Velocity, BoundingBox)
    .updateEach(([controller, input, position, velocity, boundingBox], entity) => {
      const hasInput = input.x !== 0 || input.y !== 0;
      const targetX = input.x * controller.maxSpeed;
      const targetZ = -input.y * controller.maxSpeed;
      const changeX = targetX - velocity.x;
      const changeZ = targetZ - velocity.z;
      const changeLength = Math.hypot(changeX, changeZ);
      let isGrounded = entity.has(IsGrounded);
      const rate = hasInput ? controller.acceleration : isGrounded ? controller.friction : 0;
      const maxChange = rate * delta;

      if (changeLength <= maxChange) {
        velocity.x = targetX;
        velocity.z = targetZ;
      } else if (changeLength > 0) {
        const scale = maxChange / changeLength;
        velocity.x += changeX * scale;
        velocity.z += changeZ * scale;
      }

      if (isGrounded && input.jump) {
        velocity.y = controller.jumpSpeed;
        isGrounded = false;
        entity.remove(IsGrounded);
      }

      if (!isGrounded) velocity.y += controller.gravity * delta;

      position.x += velocity.x * delta;
      position.y += velocity.y * delta;
      position.z += velocity.z * delta;

      if (groundPosition === undefined) {
        entity.remove(IsGrounded);
        return;
      }

      const groundedHeight = groundPosition.y + boundingBox.height / 2;

      if (position.y > groundedHeight) {
        entity.remove(IsGrounded);
        return;
      }

      position.y = groundedHeight;
      if (velocity.y < 0) velocity.y = 0;
      entity.add(IsGrounded);
    });
}
