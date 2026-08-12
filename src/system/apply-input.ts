import type { World } from 'koota';
import { Input, Player, Time, Velocity } from '../traits';

const ACCELERATION = 100;

export function applyInput(world: World) {
  const { delta } = world.get(Time)!;

  world.query(Player, Input, Velocity).updateEach(([input, velocity]) => {
    velocity.x += input.x * ACCELERATION * delta;
    velocity.z -= input.y * ACCELERATION * delta;
  });
}
