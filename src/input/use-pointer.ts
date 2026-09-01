import type { World } from 'koota';
import { useEffect } from 'react';
import { Pointer } from '../traits';

export function usePointer(world: World) {
  useEffect(() => {
    const toNdcX = (event: PointerEvent) => (event.clientX / window.innerWidth) * 2 - 1;
    const toNdcY = (event: PointerEvent) => -(event.clientY / window.innerHeight) * 2 + 1;

    const handlePointerButtons = (event: PointerEvent) => {
      const pointer = world.get(Pointer)!;
      // Prevent a jump on the next move.
      pointer.position.set(toNdcX(event), toNdcY(event));
      pointer.buttons = event.buttons;

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

    window.addEventListener('pointerdown', handlePointerButtons);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerButtons);
    window.addEventListener('pointercancel', handlePointerButtons);

    return () => {
      window.removeEventListener('pointerdown', handlePointerButtons);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerButtons);
      window.removeEventListener('pointercancel', handlePointerButtons);
    };
  }, [world]);
}
