import { createActions } from 'koota';
import { Quaternion, Vector3 } from 'three';
import {
  BoundingBox,
  Camera,
  CharacterController,
  Ground,
  Input,
  Physical,
  Player,
  Position,
  Rotation,
  Velocity,
} from './traits';

export const actions = createActions((world) => ({
  spawnPlayer: ({ position = [0, 0, 0], rotation = [0, 0, 0, 1] } = {}) => {
    return world.spawn(
      Player,
      CharacterController,
      Input,
      Position(new Vector3(position[0], position[1], position[2])),
      Rotation(new Quaternion(rotation[0], rotation[1], rotation[2], rotation[3])),
      Velocity,
      BoundingBox({ width: 1, height: 2.8, depth: 1 })
    );
  },
  spawnGround: () => {
    return world.spawn(Ground, Position, Physical);
  },
  spawnCamera: ({ position = [0, 0, 0], rotation = [0, 0, 0, 1] } = {}) => {
    return world.spawn(
      Camera,
      Position(new Vector3(position[0], position[1], position[2])),
      Rotation(new Quaternion(rotation[0], rotation[1], rotation[2], rotation[3]))
    );
  },
}));
