import type { World } from 'koota';
import { Euler, MathUtils } from 'three';
import { FirstPersonController } from '../controllers/firstPersonController';
import { OrbitController } from '../controllers/orbitController';
import { Rotation } from '../transform';
import { Follows, IsFirstPerson } from './traits';

export function subscribeCameraControllerSwap(world: World) {
  const unsubscribeFirstPerson = world.onAdd(IsFirstPerson, (camera) => {
    const controller = camera.get(FirstPersonController);
    const forwardRotation = camera.targetFor(Follows)?.get(Rotation) ?? camera.get(Rotation);
    if (!controller || !forwardRotation) return;

    const euler = new Euler().setFromQuaternion(forwardRotation, 'YXZ');
    camera.set(FirstPersonController, { ...controller, yaw: euler.y, pitch: 0 });
  });

  const unsubscribeThirdPerson = world.onRemove(IsFirstPerson, (camera) => {
    const firstPerson = camera.get(FirstPersonController);
    const orbit = camera.get(OrbitController);
    if (!firstPerson || !orbit) return;

    orbit.spherical.theta = firstPerson.yaw;
    orbit.spherical.phi = MathUtils.clamp(
      Math.PI / 2 + firstPerson.pitch,
      0.000001,
      Math.PI - 0.000001
    );
    orbit.velocity.set(0, 0, 0);
    camera.changed(OrbitController);
  });

  return () => {
    unsubscribeFirstPerson();
    unsubscribeThirdPerson();
  };
}
