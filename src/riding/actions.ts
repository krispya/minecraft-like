import { createActions, type Entity } from 'koota';
import { Vector3 } from 'three';
import { characterActions, IsAirborne, IsRiding } from '../character/stateMachine';
import { CharacterController, Input } from '../controllers/characterController';
import { BoxCollider, IsGrounded, Velocity } from '../physics/traits';
import { PLAYER_COLLIDER_SIZE } from '../character/player/actions';
import { Player } from '../character/player/traits';
import { Position } from '../transform';
import { Rideable, Rides } from './traits';

// How close a mount has to be to climb on.
const MOUNT_RANGE = 3;

export const ridingActions = createActions((world) => {
  const { transitionCharacter } = characterActions(world);

  const mount = (rider: Entity, target: Entity) => {
    // Without Velocity the rider drops out of every physics system.
    rider.remove(Velocity, IsGrounded);
    rider.add(Rides(target));
    transitionCharacter(rider, IsRiding);
  };

  const dismount = (rider: Entity) => {
    const target = rider.targetFor(Rides);
    if (!target) return;

    const targetPosition = target.get(Position)!;
    const targetSize = target.get(BoxCollider)?.size ?? new Vector3(1, 1, 1);
    const riderSize = rider.get(BoxCollider)?.size ?? PLAYER_COLLIDER_SIZE;

    // Stand on the mount's back, then jump off carrying its momentum.
    const riderPosition = rider.get(Position)!;
    riderPosition.copy(targetPosition);
    riderPosition.y += (targetSize.y + riderSize.y) / 2;
    rider.changed(Position);

    const velocity = target.get(Velocity)?.clone() ?? new Vector3();
    velocity.y = rider.get(CharacterController)?.jumpSpeed ?? 0;

    rider.remove(Rides(target));
    rider.add(Velocity(velocity));
    transitionCharacter(rider, IsAirborne);
  };

  return {
    // Mounting moves the rider, so input only asks for it here and the tick carries it out. That
    // way the camera follows in the same frame instead of one frame after the model.
    requestMountToggle: () => {
      const player = world.queryFirst(Player, Input);
      if (!player) return;

      player.set(Input, { mount: true });
    },
    toggleMount: () => {
      const player = world.queryFirst(Player, Position);
      if (!player) return;

      if (player.targetFor(Rides)) {
        dismount(player);
        return;
      }

      const origin = player.get(Position)!;
      let nearest: Entity | undefined;
      let nearestDistance = MOUNT_RANGE;

      world.query(Rideable, Position).forEach((candidate) => {
        // One rider per mount.
        if (world.queryFirst(Rides(candidate))) return;

        const distance = candidate.get(Position)!.distanceTo(origin);
        if (distance >= nearestDistance) return;

        nearest = candidate;
        nearestDistance = distance;
      });

      if (nearest) mount(player, nearest);
    },
  };
});
