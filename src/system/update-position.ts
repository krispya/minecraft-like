import { World } from 'koota';
import { Position, Time, Velocity } from '../traits';

export function updatePosition(world: World) {
  const time = world.get(Time)!;

  world.query(Position, Velocity).updateEach(([position, velocity]) => {
    position.x += velocity.x * time.delta;
    position.y += velocity.y * time.delta;
    position.z += velocity.z * time.delta;
  });
}
