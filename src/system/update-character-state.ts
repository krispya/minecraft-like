import { Not, type World } from 'koota';
import { actions } from '../actions';
import {
  CharacterController,
  IsAirborne,
  IsGrounded,
  IsIdle,
  IsRiding,
  IsWalking,
  Velocity,
} from '../traits';

export function updateCharacterState(world: World) {
  const { transitionCharacter } = actions(world);

  // Riders leave this state machine until they dismount.
  world.query(CharacterController, Velocity, Not(IsRiding)).readEach(([, velocity], entity) => {
    if (!entity.has(IsGrounded)) {
      transitionCharacter(entity, IsAirborne);
      return;
    }

    const horizontalSpeed = Math.hypot(velocity.x, velocity.z);
    const state = horizontalSpeed > 0.1 ? IsWalking : IsIdle;

    transitionCharacter(entity, state);
  });
}
