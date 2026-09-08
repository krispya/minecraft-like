import { trait, type World } from 'koota';
import { MathUtils, Matrix4, Spherical, Vector3 } from 'three';
import { Follows, IsThirdPerson } from '../camera/traits';
import { Pointer, Wheel } from '../input/traits';
import { Time } from '../time/traits';
import { Position, Rotation } from '../transform';

export const OrbitController = trait({
  // Offset from the target.
  spherical: () => new Spherical(4, Math.PI / 3, 0),
  target: () => new Vector3(),
  // Angular and log-radius velocity.
  velocity: () => new Spherical(0, 0, 0),
  rotateSpeed: 1,
  zoomSpeed: 1,
  // E-folds per second.
  damping: 8,
  minDistance: 2,
  maxDistance: 4,
});

const UP = new Vector3(0, 1, 0);
const matrix = new Matrix4();

export function updateOrbitController(world: World) {
  const pointer = world.get(Pointer)!;
  const wheel = world.get(Wheel)!;

  world
    .query(IsThirdPerson, OrbitController)
    .select(OrbitController)
    .updateEach(([controller]) => {
      const { velocity, rotateSpeed, zoomSpeed, damping } = controller;

      // Damping-scaled impulses preserve travel while changing coast time.
      if (pointer.buttons !== 0) {
        velocity.theta -= pointer.delta.x * Math.PI * rotateSpeed * damping;
        velocity.phi += pointer.delta.y * Math.PI * rotateSpeed * damping;
      }

      // Log-space zoom scales evenly at every distance.
      velocity.radius += Math.log(1.1) * wheel.delta * zoomSpeed * damping;
    });
}

export function moveOrbit(world: World) {
  const { delta } = world.get(Time)!;

  world
    .query(IsThirdPerson, OrbitController)
    .select(OrbitController)
    .updateEach(([controller]) => {
      const { spherical, velocity, damping, minDistance, maxDistance } = controller;

      spherical.theta += velocity.theta * delta;
      spherical.phi += velocity.phi * delta;
      // Integrate radius in log space.
      spherical.radius *= Math.exp(velocity.radius * delta);

      // Stop velocity at distance limits.
      const radius = MathUtils.clamp(spherical.radius, minDistance, maxDistance);
      if (radius !== spherical.radius) velocity.radius = 0;
      spherical.radius = radius;

      const phi = spherical.phi;
      // Avoid singularities at the poles.
      spherical.makeSafe();
      if (spherical.phi !== phi) velocity.phi = 0;

      velocity.theta = MathUtils.damp(velocity.theta, 0, damping, delta);
      velocity.phi = MathUtils.damp(velocity.phi, 0, damping, delta);
      velocity.radius = MathUtils.damp(velocity.radius, 0, damping, delta);
    });
}

export function applyOrbit(world: World) {
  world
    .query(IsThirdPerson, OrbitController, Position, Rotation)
    .select(OrbitController, Position, Rotation)
    .updateEach(([controller, position, rotation]) => {
      const { spherical, target } = controller;

      position.setFromSpherical(spherical).add(target);
      matrix.lookAt(position, target, UP);
      rotation.setFromRotationMatrix(matrix);
    });
}

export function updateFollowTarget(world: World) {
  world
    .query(Follows('*'), OrbitController)
    .select(OrbitController)
    .updateEach(([controller], entity) => {
      const targetPosition = entity.targetFor(Follows)?.get(Position);

      if (targetPosition) controller.target.copy(targetPosition);
    });
}
