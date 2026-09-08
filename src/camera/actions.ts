import { createActions } from 'koota';
import { Quaternion, Vector3 } from 'three';
import { Position, Rotation } from '../transform';
import { Camera, IsFirstPerson, IsThirdPerson } from './traits';

export const cameraActions = createActions((world) => ({
  spawnCamera: ({ position = [0, 0, 0], rotation = [0, 0, 0, 1] } = {}) => {
    return world.spawn(
      Camera,
      Position(new Vector3(position[0], position[1], position[2])),
      Rotation(new Quaternion(rotation[0], rotation[1], rotation[2], rotation[3]))
    );
  },
  toggleCameraPerspective: () => {
    world.query(Camera).forEach((camera) => {
      const perspective = camera.has(IsFirstPerson) ? IsThirdPerson : IsFirstPerson;

      camera.remove(IsFirstPerson, IsThirdPerson);
      camera.add(perspective);
    });
  },
}));
