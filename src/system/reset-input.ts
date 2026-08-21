import type { World } from 'koota';
import { Pointer, Wheel } from '../traits';

// Clear deltas after all consumers run.
export function resetInputDelta(world: World) {
  const pointer = world.get(Pointer)!;
  pointer.delta.set(0, 0);
  world.set(Pointer, pointer);

  const wheel = world.get(Wheel)!;
  wheel.delta = 0;
  world.set(Wheel, wheel);
}
