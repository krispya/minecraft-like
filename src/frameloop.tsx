import { useWorld } from 'koota/react';
import { applyGravity } from './system/apply-gravity';
import { resolveGroundCollision } from './system/resolve-ground-collision';
import { moveEntity } from './system/move-entity';
import { updateTime } from './system/update-time';
import { useAnimationFrame } from './utils/use-animation-frame';

export function Frameloop() {
  const world = useWorld();

  useAnimationFrame(() => {
    updateTime(world);
    applyGravity(world);
    moveEntity(world);
    resolveGroundCollision(world);
  });

  return null;
}
