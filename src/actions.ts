import { createActions } from 'koota';
import { Quaternion, Vector3 } from 'three';
import {
  BoxCollider,
  Camera,
  CharacterController,
  Ground,
  Input,
  PlaneCollider,
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
      BoxCollider({ size: new Vector3(0.6, 2, 0.6) })
    );
  },
  spawnGround: () => {
    return world.spawn(Ground, PlaneCollider, Position);
  },
  spawnCamera: ({ position = [0, 0, 0], rotation = [0, 0, 0, 1] } = {}) => {
    return world.spawn(
      Camera,
      Position(new Vector3(position[0], position[1], position[2])),
      Rotation(new Quaternion(rotation[0], rotation[1], rotation[2], rotation[3]))
    );
  },
}));
