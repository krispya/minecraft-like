import type { World } from 'koota';
import { useEffect } from 'react';
import { Wheel } from '../traits';

export function useWheel(world: World) {
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      // Keep wheel input in the scene.
      event.preventDefault();

      const wheel = world.get(Wheel)!;
      // Normalize pixel, line, and page deltas to wheel notches.
      const scale = [1 / 100, 1 / 3, 1];
      wheel.delta += event.deltaY * (scale[event.deltaMode] ?? scale[0]);

      world.set(Wheel, wheel);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [world]);
}
