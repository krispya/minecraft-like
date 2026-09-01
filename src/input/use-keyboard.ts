import type { World } from 'koota';
import { useEffect } from 'react';
import { actions } from '../actions';
import { Keys } from '../traits';

export function useKeyboard(world: World) {
  useEffect(() => {
    const keys = world.get(Keys)!;
    const { toggleCameraPerspective } = actions(world);

    const setKey = (key: string, pressed: boolean) => {
      if (pressed) keys.add(key);
      else keys.delete(key);

      world.set(Keys, keys);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (key === 'f' && !keys.has(key)) toggleCameraPerspective();

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
