import type { World } from 'koota';
import { useEffect } from 'react';
import { useWorld } from 'koota/react';
import { applyGravity } from './system/apply-gravity';
import { moveEntity } from './system/move-entity';
import { applyOrbit, moveOrbit, updateOrbitController } from './system/orbit-controller';
import { resetInputDelta } from './system/reset-input';
import { resolveGroundCollision } from './system/resolve-ground-collision';
import { updateCharacterController } from './system/update-character-controller';
import { updateFollowTarget } from './system/update-follow-target';
import { updatePlayerInput } from './system/update-player-input';
import { updateTime } from './system/update-time';
import { Keys, Pointer, Wheel } from './traits';
import { useAnimationFrame } from './utils/use-animation-frame';

export function Frameloop() {
  const world = useWorld();
  useKeyboard(world);
  usePointer(world);
  useWheel(world);

  useAnimationFrame(() => {
    updateTime(world);

    updatePlayerInput(world);
    updateOrbitController(world);

    updateCharacterController(world);
    applyGravity(world);

    moveEntity(world);
    resolveGroundCollision(world);

    updateFollowTarget(world);
    moveOrbit(world);
    applyOrbit(world);

    resetInputDelta(world);
  });

  return null;
}

function useKeyboard(world: World) {
  useEffect(() => {
    const keys = world.get(Keys)!;

    const setKey = (key: string, pressed: boolean) => {
      if (pressed) keys.add(key);
      else keys.delete(key);

      world.set(Keys, keys);
    };

    const handleKeyDown = (event: KeyboardEvent) => setKey(event.key.toLowerCase(), true);
    const handleKeyUp = (event: KeyboardEvent) => setKey(event.key.toLowerCase(), false);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [world]);
}

function usePointer(world: World) {
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

// Normalize pixel, line, and page deltas to wheel notches.
const WHEEL_SCALE = [1 / 100, 1 / 3, 1];

function useWheel(world: World) {
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      // Keep wheel input in the scene.
      event.preventDefault();

      const wheel = world.get(Wheel)!;
      wheel.delta += event.deltaY * (WHEEL_SCALE[event.deltaMode] ?? WHEEL_SCALE[0]);

      world.set(Wheel, wheel);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [world]);
}
