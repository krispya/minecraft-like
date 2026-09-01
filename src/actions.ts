import { createActions, type Entity } from 'koota';
import { Quaternion, Spherical, Vector3 } from 'three';
import {
  BoundingBox,
  Camera,
  CharacterController,
  Follows,
  Ground,
  Input,
  OrbitController,
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
  spawnCamera: (
    follows: Entity,
    {
      position = [0, 0, 0],
      rotation = [0, 0, 0, 1],
      orbit: { spherical = [30, Math.PI / 3, Math.PI / 4], target = [0, 2, 0], damping = 8 } = {},
    } = {}
  ) => {
    return world.spawn(
      Camera,
      Follows(follows),
      Position(new Vector3(position[0], position[1], position[2])),
      Rotation(new Quaternion(rotation[0], rotation[1], rotation[2], rotation[3])),
      OrbitController({
        spherical: new Spherical(spherical[0], spherical[1], spherical[2]),
        target: new Vector3(target[0], target[1], target[2]),
        damping,
      })
    );
  },
}));
