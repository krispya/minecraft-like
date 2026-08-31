import { World } from 'koota';
import { Physical, Position, Time, Velocity } from '../traits';

export function moveEntity(world: World) {
  const time = world.get(Time)!;

  world.query(Physical, Position, Velocity).updateEach(([, position, velocity]) => {
    position.x += velocity.x * time.delta;
    position.y += velocity.y * time.delta;
    position.z += velocity.z * time.delta;
  });
}
