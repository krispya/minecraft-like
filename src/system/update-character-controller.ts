import type { World } from 'koota';
import { Quaternion, Vector3 } from 'three';
import {
  CharacterController,
  Input,
  IsGrounded,
  Position,
  Rotation,
  Time,
  Velocity,
} from '../traits';

const UP = new Vector3(0, 1, 0);
const targetRotation = new Quaternion();

export function updateCharacterController(world: World) {
  const { delta } = world.get(Time)!;

  world
    .query(CharacterController, Input, Position, Rotation, Velocity)
    .updateEach(([controller, input, position, rotation, velocity], entity) => {
      const hasInput = input.x !== 0 || input.y !== 0;
      const targetX = input.x * controller.maxSpeed;
      const targetZ = -input.y * controller.maxSpeed;
      const changeX = targetX - velocity.x;
      const changeZ = targetZ - velocity.z;
      const changeLength = Math.hypot(changeX, changeZ);
      let isGrounded = entity.has(IsGrounded);
      const rate = hasInput ? controller.acceleration : isGrounded ? controller.friction : 0;
      const maxChange = rate * delta;

      if (hasInput) {
        const targetYaw = Math.atan2(-input.x, input.y);
        targetRotation.setFromAxisAngle(UP, targetYaw);
        const turnAlpha = 1 - Math.exp(-controller.turnSpeed * delta);
        rotation.slerp(targetRotation, turnAlpha);
      }

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
