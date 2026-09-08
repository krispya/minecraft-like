import type { World } from 'koota';
import { useEffect } from 'react';
import { actions } from '../actions';
import { Player } from '../character/player/traits';
import type { ItemKind } from '../item/traits';
import { Position } from '../transform';
import { Keys, Pointer, Wheel } from './traits';

// Number keys pick the item in hand, like Minecraft's hotbar.
const HOTBAR: Record<string, ItemKind> = { '1': 'block', '2': 'hammer' };

export function useKeyboard(world: World) {
  useEffect(() => {
    const keys = world.get(Keys)!;
    const {
      toggleCameraPerspective,
      spawnPigNear,
      requestMountToggle,
      generateWorld,
      selectPlayerItem,
    } = actions(world);

    const setKey = (key: string, pressed: boolean) => {
      if (pressed) keys.add(key);
      else keys.delete(key);

      world.set(Keys, keys);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (key === 'f' && !keys.has(key)) toggleCameraPerspective();
      if (key === 'r' && !keys.has(key)) {
        const position = world.queryFirst(Player, Position)?.get(Position);
        if (position) spawnPigNear(position);
      }
      if (key === 'e' && !keys.has(key)) requestMountToggle();
      if (key === 'g' && !keys.has(key)) generateWorld();
      if (HOTBAR[key] && !keys.has(key)) selectPlayerItem(HOTBAR[key]);

      setKey(key, true);
    };
    const handleKeyUp = (event: KeyboardEvent) => setKey(event.key.toLowerCase(), false);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [world]);
}

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
