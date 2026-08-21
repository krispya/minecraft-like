import { createActions } from 'koota';
import { Quaternion, Vector3 } from 'three';
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
  spawnPlayer: ({ position = new Vector3(), rotation = new Quaternion() } = {}) => {
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
  spawnCamera: ({ position = new Vector3(), rotation = new Quaternion() } = {}) => {
    return world.spawn(Camera, Position(position), Rotation(rotation));
  },
}));
