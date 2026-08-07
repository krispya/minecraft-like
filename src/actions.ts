import { createActions } from 'koota';
import { Ground, Player, Position, Velocity } from './traits';

export const actions = createActions((world) => ({
  spawnPlayer: () => {
    return world.spawn(Player, Position, Velocity);
  },
  spawnGround: () => {
    return world.spawn(Ground, Position);
  },
}));
