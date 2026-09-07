import { createActions } from 'koota';
import { Vector3 } from 'three';
import { CharacterController, Input } from '../character/traits';
import { BoxCollider, Velocity } from '../physics/traits';
import { Position, Rotation } from '../transform/traits';
import { Player } from './traits';

export const playerActions = createActions((world) => ({
  spawnPlayer: ({ position = [0, 0, 0] } = {}) => {
    return world.spawn(
      Player,
      CharacterController,
      Input,
      Position(new Vector3(...position)),
      Rotation,
      Velocity,
      // A box matching the capsule's width and height.
      BoxCollider({ size: new Vector3(0.6, 2, 0.6) })
    );
  },
}));
