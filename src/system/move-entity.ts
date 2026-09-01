import { World } from 'koota';
import { DynamicBody, Position, Time, Velocity } from '../traits';

export function moveEntity(world: World) {
  const time = world.get(Time)!;

  world.query(DynamicBody, Position, Velocity).updateEach(([, position, velocity]) => {
    position.x += velocity.x * time.delta;
    position.y += velocity.y * time.delta;
    position.z += velocity.z * time.delta;
  });
}
