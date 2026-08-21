import { createActions } from 'koota';
import {
  BoundingBox,
  Camera,
  Ground,
  Input,
  Physical,
  Player,
  Position,
  Rotation,
  Velocity,
} from './traits';

export const actions = createActions((world) => ({
  spawnPlayer: ({ position = { x: 0, y: 0, z: 0 }, rotation = { x: 0, y: 0, z: 0, w: 0 } } = {}) => {
    return world.spawn(
      Player,
      Input,
      Position(position),
      Rotation(rotation),
      Velocity,
      Physical,
      BoundingBox({ width: 1, height: 2.8, depth: 1 })
    );
  },
  spawnGround: () => {
    return world.spawn(Ground, Position, Physical);
  },
  spawnCamera: ({ position = { x: 0, y: 0, z: 0 }, rotation = { x: 0, y: 0, z: 0, w: 0 } } = {}) => {
    return world.spawn(Camera, Position(position), Rotation(rotation));
  },
}));
