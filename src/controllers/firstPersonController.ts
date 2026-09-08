import { trait, type World } from 'koota';
import { Euler, MathUtils, Vector3 } from 'three';
import { Camera, Follows, IsFirstPerson } from '../camera/traits';
import { Pointer } from '../input/traits';
import { Position, Rotation } from '../transform';

export const FirstPersonController = trait({
  offset: () => new Vector3(0, 0.75, 0),
  yaw: 0,
  pitch: 0,
  rotateSpeed: 1,
});

const euler = new Euler(0, 0, 0, 'YXZ');

export function updateFirstPersonController(world: World) {
  const pointer = world.get(Pointer)!;

  world
    .query(Camera, IsFirstPerson, FirstPersonController)
    .select(FirstPersonController)
    .updateEach(([controller], entity) => {
      if (pointer.buttons === 0) return;

      controller.yaw -= pointer.delta.x * Math.PI * controller.rotateSpeed;
      controller.pitch = MathUtils.clamp(
        controller.pitch + pointer.delta.y * Math.PI * controller.rotateSpeed,
        -Math.PI / 2 + 0.01,
        Math.PI / 2 - 0.01
      );

      const target = entity.targetFor(Follows);
      const targetRotation = target?.get(Rotation);

      if (target && targetRotation) {
        targetRotation.setFromEuler(euler.set(0, controller.yaw, 0));
        target.changed(Rotation);
      }
    });
}

export function applyFirstPerson(world: World) {
  world
    .query(Camera, IsFirstPerson, FirstPersonController, Follows('*'), Position, Rotation)
    .select(FirstPersonController, Position, Rotation)
    .updateEach(([controller, position, rotation], entity) => {
      const targetPosition = entity.targetFor(Follows)?.get(Position);
      if (!targetPosition) return;

      position.copy(targetPosition).add(controller.offset);
      rotation.setFromEuler(euler.set(controller.pitch, controller.yaw, 0));
    });
}
