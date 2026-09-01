import { createActions, type Entity, type TagTrait } from 'koota';
import { Quaternion, Vector3 } from 'three';
import {
  BoxCollider,
  Camera,
  CharacterController,
  Ground,
  Input,
  IsAirborne,
  IsFirstPerson,
  IsIdle,
  IsThirdPerson,
  IsWalking,
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
      IsIdle,
      Input,
      Position(new Vector3(position[0], position[1], position[2])),
      Rotation(new Quaternion(rotation[0], rotation[1], rotation[2], rotation[3])),
      Velocity,
      BoxCollider({ size: new Vector3(0.6, 2, 0.6) })
    );
  },
  transitionCharacter: (entity: Entity, state: TagTrait) => {
    if (entity.has(state)) return;

    entity.remove(IsIdle, IsWalking, IsAirborne);
    entity.add(state);
  },
  toggleCameraPerspective: () => {
    world.query(Camera).forEach((camera) => {
      const perspective = camera.has(IsFirstPerson) ? IsThirdPerson : IsFirstPerson;

      camera.remove(IsFirstPerson, IsThirdPerson);
      camera.add(perspective);
    });
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
