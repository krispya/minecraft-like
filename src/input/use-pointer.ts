import type { World } from 'koota';
import { useEffect } from 'react';
import { Pointer } from '../traits';

export function usePointer(world: World) {
  useEffect(() => {
    const toNdcX = (event: PointerEvent) => (event.clientX / window.innerWidth) * 2 - 1;
    const toNdcY = (event: PointerEvent) => -(event.clientY / window.innerHeight) * 2 + 1;

    const handlePointerDown = (event: PointerEvent) => {
      const pointer = world.get(Pointer)!;
      // Prevent a jump on the first move.
      pointer.position.set(toNdcX(event), toNdcY(event));
      pointer.isDown = true;

      world.set(Pointer, pointer);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const pointer = world.get(Pointer)!;
      const x = toNdcX(event);
      const y = toNdcY(event);

      // Preserve moves between frames.
      pointer.delta.x += x - pointer.position.x;
      pointer.delta.y += y - pointer.position.y;
      pointer.position.set(x, y);

      world.set(Pointer, pointer);
    };

    const handlePointerUp = (event: PointerEvent) => {
      const pointer = world.get(Pointer)!;
      // buttons excludes the released button.
      pointer.isDown = event.buttons !== 0;

      world.set(Pointer, pointer);
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [world]);
}
