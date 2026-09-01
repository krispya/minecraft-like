import { Not, World } from 'koota';
import { DynamicBody, IsGrounded, Time, Velocity } from '../traits';

const GRAVITY = -9.81;

export function applyGravity(world: World) {
  const time = world.get(Time)!;

  world.query(DynamicBody, Velocity, Not(IsGrounded)).updateEach(([, velocity]) => {
    velocity.y += GRAVITY * time.delta;
  });
}
