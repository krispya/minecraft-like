import { createActions, type Entity, type TagTrait } from 'koota';
import { Euler, MathUtils, Quaternion, Vector3 } from 'three';
import {
  BoxCollider,
  Camera,
  CharacterController,
  FirstPersonController,
  Follows,
  Ground,
  Input,
  IsAirborne,
  IsFirstPerson,
  IsIdle,
  IsThirdPerson,
  IsWalking,
  OrbitController,
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
      const firstPerson = camera.get(FirstPersonController);
      const orbit = camera.get(OrbitController);
      if (!firstPerson || !orbit) return;

      if (camera.has(IsFirstPerson)) {
        orbit.spherical.theta = firstPerson.yaw;
        orbit.spherical.phi = MathUtils.clamp(
          Math.PI / 2 + firstPerson.pitch,
          0.000001,
          Math.PI - 0.000001
        );
        orbit.velocity.set(0, 0, 0);
        camera.changed(OrbitController);

        camera.remove(IsFirstPerson);
        camera.add(IsThirdPerson);
        return;
      }

      const forwardRotation = camera.targetFor(Follows)?.get(Rotation) ?? camera.get(Rotation);
      if (!forwardRotation) return;

      const euler = new Euler().setFromQuaternion(forwardRotation, 'YXZ');
      camera.set(FirstPersonController, { ...firstPerson, yaw: euler.y, pitch: 0 });

      camera.remove(IsThirdPerson);
      camera.add(IsFirstPerson);
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
