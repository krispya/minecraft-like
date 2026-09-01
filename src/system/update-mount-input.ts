import type { World } from 'koota';
import { Input, Rides } from '../traits';

// The rider steers: their input drives the mount instead of themselves.
export function updateMountInput(world: World) {
  world
    .query(Rides('*'), Input)
    .select(Input)
    .updateEach(([input], rider) => {
      const mount = rider.targetFor(Rides);
      if (!mount?.has(Input)) return;

      // Mounts never jump.
      mount.set(Input, { x: input.x, y: input.y, jump: false });
    });
}
