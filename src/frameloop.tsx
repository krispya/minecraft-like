import { useWorld } from 'koota/react';
import { applyGravity } from './system/apply-gravity';
import { resolveGroundCollision } from './system/resolve-ground-collision';
import { updatePosition } from './system/update-position';
import { updateTime } from './system/update-time';
import { useAnimationFrame } from './utils/use-animation-frame';

export function Frameloop() {
  const world = useWorld();

  useAnimationFrame(() => {
    updateTime(world);
    applyGravity(world);
    updatePosition(world);
    resolveGroundCollision(world);
  });

  return null;
}
