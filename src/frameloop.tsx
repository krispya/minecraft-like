import { useWorld } from 'koota/react';
import { resolveGroundCollision } from './system/resolve-ground-collision';
import { updateTime } from './system/update-time';
import { useAnimationFrame } from './utils/use-animation-frame';

export function Frameloop() {
  const world = useWorld();

  useAnimationFrame(() => {
    updateTime(world);
    resolveGroundCollision(world);
  });

  return null;
}
