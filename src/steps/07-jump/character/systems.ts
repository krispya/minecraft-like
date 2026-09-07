import type { World } from 'koota';
import { IsGrounded, Velocity } from '../physics/traits';
import { Time } from '../time/traits';
import { Position } from '../transform/traits';
import { CharacterController, Input } from './traits';

export function updateCharacterController(world: World) {
  const { delta } = world.get(Time)!;

  world
    .query(CharacterController, Input, Position, Velocity)
    .updateEach(([controller, input, position, velocity], entity) => {
      const hasInput = input.x !== 0 || input.y !== 0;
      // Forward is -z in Three, so a positive y input moves toward negative z.
      const targetX = input.x * controller.maxSpeed;
      const targetZ = -input.y * controller.maxSpeed;
      const changeX = targetX - velocity.x;
      const changeZ = targetZ - velocity.z;
      const changeLength = Math.hypot(changeX, changeZ);
      let isGrounded = entity.has(IsGrounded);
      // With no input, apply friction only on the ground.
      const rate = hasInput ? controller.acceleration : isGrounded ? controller.friction : 0;
      const maxChange = rate * delta;

      // Move the velocity toward the target, but only as far as the rate allows this tick.
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
    });
}
