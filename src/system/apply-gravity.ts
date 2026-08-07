import { World } from 'koota';
import { Time, Velocity } from '../traits';

const GRAVITY = -9.81;

export function applyGravity(world: World) {
  const time = world.get(Time)!;

  world.query(Velocity).updateEach(([velocity]) => {
    velocity.y += GRAVITY * time.delta;
  });
}
