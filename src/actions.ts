import { createActions } from 'koota';
import { BoundingBox, Ground, Physical, Player, Position, Velocity } from './traits';

export const actions = createActions((world) => ({
  spawnPlayer: (position = { x: 0, y: 0, z: 0 }) => {
    return world.spawn(
      Player,
      Position(position),
      Velocity,
      Physical,
      BoundingBox({ width: 1, height: 2.8, depth: 1 })
    );
  },
  spawnGround: () => {
    return world.spawn(Ground, Position, Physical);
  },
}));
