import type { World } from 'koota';
import { useEffect } from 'react';
import { useWorld } from 'koota/react';
import { applyGravity } from './system/apply-gravity';
import { applyInput } from './system/apply-input';
import { moveEntity } from './system/move-entity';
import { pollKeys } from './system/poll-keys';
import { resolveGroundCollision } from './system/resolve-ground-collision';
import { updateTime } from './system/update-time';
import { Keys } from './traits';
import { useAnimationFrame } from './utils/use-animation-frame';

export function Frameloop() {
  const world = useWorld();
  useKeyboard(world);

  useAnimationFrame(() => {
    updateTime(world);
    // Poll input: What is the keyboard doing?
    pollKeys(world);
    // Calculate movement. Where am I moving?

    // Apply movement. Okay turn movement vectors into velocity
    applyInput(world);
    applyGravity(world);
    moveEntity(world);
    resolveGroundCollision(world);
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
