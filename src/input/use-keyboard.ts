import type { World } from 'koota';
import { useEffect } from 'react';
import { actions } from '../actions';
import { type ItemKind, Keys } from '../traits';

// Number keys pick the item in hand, like Minecraft's hotbar.
const HOTBAR: Record<string, ItemKind> = { '1': 'block', '2': 'hammer' };

export function useKeyboard(world: World) {
  useEffect(() => {
    const keys = world.get(Keys)!;
    const {
      toggleCameraPerspective,
      spawnPigNearPlayer,
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
      if (key === 'r' && !keys.has(key)) spawnPigNearPlayer();
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
