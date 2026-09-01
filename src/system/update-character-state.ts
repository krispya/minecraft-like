import type { World } from 'koota';
import { actions } from '../actions';
import { CharacterController, IsAirborne, IsGrounded, IsIdle, IsWalking, Velocity } from '../traits';

export function updateCharacterState(world: World) {
  const { transitionCharacter } = actions(world);

  world.query(CharacterController, Velocity).readEach(([, velocity], entity) => {
    if (!entity.has(IsGrounded)) {
      transitionCharacter(entity, IsAirborne);
      return;
    }

    const horizontalSpeed = Math.hypot(velocity.x, velocity.z);
    const state = horizontalSpeed > 0.1 ? IsWalking : IsIdle;

    transitionCharacter(entity, state);
  });
}
