import { createActions } from 'koota';
import { random } from 'math/random';
import { Vector3 } from 'three';
import { CharacterController, Input } from '../../controllers/characterController';
import { IsIdle } from '../stateMachine';
import { Wander } from '../wander';
import { BoxCollider, Velocity } from '../../physics/traits';
import { Rideable } from '../../riding/traits';
import { Position, Rotation } from '../../transform';
import { Pig } from './traits';

export const pigActions = createActions((world) => {
  const spawnPig = (position: Vector3) => {
    return world.spawn(
      Pig,
      Wander,
      Rideable,
      // Faster than the player when ridden. Wander scales the heading down so loose pigs amble.
      CharacterController({ maxSpeed: 7, acceleration: 40, turnSpeed: 6 }),
      IsIdle,
      Input,
      Position(position.clone()),
      Rotation,
      Velocity,
      // Minecraft's pig hitbox.
      BoxCollider({ size: new Vector3(0.9, 0.9, 0.9) })
    );
  };

  return {
    spawnPig,
    spawnPigNear: (position: Vector3, { minDistance = 2, maxDistance = 4 } = {}) => {
      const angle = random.float(Math.random, 0, Math.PI * 2);
      const distance = random.float(Math.random, minDistance, maxDistance);

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
