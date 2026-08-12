import type { World } from 'koota';
import { useEffect } from 'react';
import { useWorld } from 'koota/react';
import { applyGravity } from './system/apply-gravity';
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
    pollKeys(world);
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
