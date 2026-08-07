import { createActions } from 'koota';
import { BoundingBox, Ground, Player, Position, Velocity } from './traits';

export const actions = createActions((world) => ({
  spawnPlayer: () => {
    return world.spawn(Player, Position, Velocity, BoundingBox({ width: 1, height: 2.8, depth: 1 }));
  },
  spawnGround: () => {
    return world.spawn(Ground, Position);
  },
}));
