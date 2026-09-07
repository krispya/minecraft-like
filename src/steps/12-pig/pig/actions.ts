import { createActions } from 'koota';
import { Vector3 } from 'three';
import { CharacterController, Input, IsIdle } from '../character/traits';
import { BoxCollider, Velocity } from '../physics/traits';
import { Position, Rotation } from '../transform/traits';
import { Pig, Wander } from './traits';

export const pigActions = createActions((world) => {
  const spawnPig = (position: Vector3) => {
    return world.spawn(
      Pig,
      Wander,
      // Same controller as the player, tuned for a pig. Wander scales the heading down so a
      // loose pig ambles.
      CharacterController({ maxSpeed: 7, acceleration: 40, turnSpeed: 6 }),
      IsIdle,
      Input,
      Position(position.clone()),
      Rotation,
      Velocity,
      // A box around the pig.
      BoxCollider({ size: new Vector3(0.9, 0.9, 0.9) })
    );
  };

  return {
    spawnPig,
    // Drops a pig a few units from a spot, in a random direction.
    spawnPigNear: (position: Vector3, { minDistance = 2, maxDistance = 4 } = {}) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = minDistance + Math.random() * (maxDistance - minDistance);

      return spawnPig(
        new Vector3(
          position.x + Math.cos(angle) * distance,
          position.y + 1,
          position.z + Math.sin(angle) * distance
        )
      );
    },
  };
});
