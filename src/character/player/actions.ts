import { createActions } from 'koota';
import { Quaternion, Vector3 } from 'three';
import { CharacterController, Input } from '../../controllers/characterController';
import { IsIdle } from '../stateMachine';
import { BlockInteraction } from '../../item/traits';
import { BoxCollider, Velocity } from '../../physics/traits';
import { Position, Rotation } from '../../transform';
import { Player } from './traits';

export const PLAYER_COLLIDER_SIZE = new Vector3(0.6, 2, 0.6);

export const playerActions = createActions((world) => ({
  spawnPlayer: ({ position = [0, 0, 0], rotation = [0, 0, 0, 1] } = {}) => {
    return world.spawn(
      Player,
      CharacterController,
      BlockInteraction,
      IsIdle,
      Input,
      Position(new Vector3(position[0], position[1], position[2])),
      Rotation(new Quaternion(rotation[0], rotation[1], rotation[2], rotation[3])),
      Velocity,
      BoxCollider({ size: PLAYER_COLLIDER_SIZE.clone() })
    );
  },
}));
