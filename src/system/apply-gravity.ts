import { Not, World } from 'koota';
import { IsGrounded, Physical, Time, Velocity } from '../traits';

const GRAVITY = -9.81;

export function applyGravity(world: World) {
  const time = world.get(Time)!;

  world.query(Velocity, Physical, Not(IsGrounded)).updateEach(([velocity]) => {
    velocity.y += GRAVITY * time.delta;
  });
}
