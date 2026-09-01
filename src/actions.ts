import { createActions, type Entity, type TagTrait } from 'koota';
import { Quaternion, Vector3 } from 'three';
import {
  Block,
  BlockDamage,
  BlockInteraction,
  BoxCollider,
  Camera,
  CharacterController,
  Ground,
  HeldBy,
  Input,
  IsAirborne,
  IsFirstPerson,
  IsGrounded,
  IsIdle,
  IsRiding,
  IsThirdPerson,
  IsWalking,
  Item,
  type ItemKind,
  Mining,
  Npc,
  Pig,
  PlaneCollider,
  Player,
  Position,
  Rideable,
  Rides,
  Rotation,
  ToolSwing,
  Velocity,
  Wander,
} from './traits';

const PLAYER_COLLIDER_SIZE = new Vector3(0.6, 2, 0.6);
// How close a mount has to be to climb on.
const MOUNT_RANGE = 3;

export const actions = createActions((world) => {
  const isWithinReach = (point: Vector3) => {
    const player = world.queryFirst(Player, BlockInteraction, Position);
    if (!player) return false;

    const { range, eyeHeight } = player.get(BlockInteraction)!;
    const eye = player.get(Position)!.clone();
    eye.y += eyeHeight;

    return point.distanceTo(eye) <= range;
  };

  const swingTool = () => {
    const player = world.queryFirst(Player);
    const swing = player?.get(ToolSwing);
    // Like Minecraft, a swing in progress only restarts once it is past halfway.
    if (!player || (swing && swing.elapsed < swing.duration / 2)) return;

    // Re-adding restarts the swing and notifies onAdd subscribers.
    player.remove(ToolSwing);
    player.add(ToolSwing);
  };

  // Returns whether the hit landed.
  const mineBlock = (block: Entity, point: Vector3) => {
    const damage = block.get(BlockDamage);
    if (!damage || !isWithinReach(point)) return false;

    const hits = damage.hits + 1;
    if (hits >= damage.hitsToBreak) block.destroy();
    else block.set(BlockDamage, { ...damage, hits });

    return true;
  };

  const spawnBlockAt = (position: Vector3) => {
    const snappedPosition = position
      .clone()
      .set(Math.round(position.x), Math.round(position.y - 0.5) + 0.5, Math.round(position.z));

    const isOccupied = world
      .query(Block, Position)
      .some((block) => block.get(Position)?.equals(snappedPosition));
    if (isOccupied) return;

    // Blocks cannot be placed inside any moving body, like the player or a mob.
    const intersectsBody = world.query(Velocity, Position, BoxCollider).some((body) => {
      const bodyPosition = body.get(Position)!;
      const collider = body.get(BoxCollider)!;

      return (
        Math.abs(bodyPosition.x - snappedPosition.x) < (collider.size.x + 1) / 2 &&
        Math.abs(bodyPosition.y - snappedPosition.y) < (collider.size.y + 1) / 2 &&
        Math.abs(bodyPosition.z - snappedPosition.z) < (collider.size.z + 1) / 2
      );
    });
    if (intersectsBody) return;

    return world.spawn(Block, BlockDamage, Position(snappedPosition), BoxCollider);
  };

  const spawnPig = ({ position = [0, 0, 0] } = {}) => {
    return world.spawn(
      Npc,
      Pig,
      Wander,
      Rideable,
      // Pigs amble: slower than the player and slower to turn. They never jump.
      CharacterController({ maxSpeed: 1.5, acceleration: 15, turnSpeed: 4 }),
      IsIdle,
      Input,
      Position(new Vector3(position[0], position[1], position[2])),
      Rotation,
      Velocity,
      // Minecraft's pig hitbox.
      BoxCollider({ size: new Vector3(0.9, 0.9, 0.9) })
    );
  };

  // Drops a pig a few blocks from the player in a random direction.
  const spawnPigNearPlayer = ({ minDistance = 2, maxDistance = 4 } = {}) => {
    const player = world.queryFirst(Player, Position);
    if (!player) return;

    const origin = player.get(Position)!;
    const angle = Math.random() * Math.PI * 2;
    const distance = minDistance + Math.random() * (maxDistance - minDistance);

    return spawnPig({
      position: [
        origin.x + Math.cos(angle) * distance,
        origin.y + 1,
        origin.z + Math.sin(angle) * distance,
      ],
    });
  };

  const mount = (rider: Entity, target: Entity) => {
    // Without Velocity the rider drops out of every physics system.
    rider.remove(Velocity, IsGrounded);
    rider.add(Rides(target), IsRiding);
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

    rider.remove(Rides(target), IsRiding);
    rider.add(Velocity(velocity));
  };

  const toggleMount = () => {
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
  };

  return {
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
    spawnPig,
    spawnPigNearPlayer,
    toggleMount,
    transitionCharacter: (entity: Entity, state: TagTrait) => {
      if (entity.has(state)) return;

      entity.remove(IsIdle, IsWalking, IsAirborne);
      entity.add(state);
    },
    toggleCameraPerspective: () => {
      world.query(Camera).forEach((camera) => {
        const perspective = camera.has(IsFirstPerson) ? IsThirdPerson : IsFirstPerson;

        camera.remove(IsFirstPerson, IsThirdPerson);
        camera.add(perspective);
      });
    },
    spawnGround: () => {
      return world.spawn(Ground, PlaneCollider, Position);
    },
    spawnItem: (kind: ItemKind) => {
      return world.spawn(Item({ kind }));
    },
    equipItem: (holder: Entity, item: Entity) => {
      world.query(HeldBy(holder)).forEach((held) => held.remove(HeldBy(holder)));
      item.add(HeldBy(holder));
    },
    swingTool,
    spawnBlockAt,
    mineBlock,
    // Lands the first hit right away. The swing loop keeps hitting while the button is held.
    startMining: (block: Entity, point: Vector3) => {
      const player = world.queryFirst(Player);
      if (!player || !mineBlock(block, point) || !world.has(block)) return;

      player.add(Mining(block));
    },
    stopMining: () => {
      world.query(Mining('*')).forEach((player) => {
        const block = player.targetFor(Mining);
        if (block) player.remove(Mining(block));
      });
    },
    placeBlock: (surface: Entity, hit: { point: Vector3; normal: Vector3 }) => {
      if (!isWithinReach(hit.point)) return;

      let position: Vector3;

      if (surface.has(Block)) {
        const surfacePosition = surface.get(Position);
        if (!surfacePosition || hit.normal.lengthSq() === 0) return;

        const x = Math.abs(hit.normal.x);
        const y = Math.abs(hit.normal.y);
        const z = Math.abs(hit.normal.z);
        const offset = new Vector3();

        if (x >= y && x >= z) offset.x = Math.sign(hit.normal.x);
        else if (y >= z) offset.y = Math.sign(hit.normal.y);
        else offset.z = Math.sign(hit.normal.z);

        position = surfacePosition.clone().add(offset);
      } else {
        const plane = surface.get(PlaneCollider);
        if (!plane || plane.normal.lengthSq() === 0) return;

        position = hit.point.clone().addScaledVector(plane.normal.clone().normalize(), 0.5);
      }

      const block = spawnBlockAt(position);
      // Placing swings the hand, like Minecraft's use animation.
      if (block) swingTool();

      return block;
    },
    spawnCamera: ({ position = [0, 0, 0], rotation = [0, 0, 0, 1] } = {}) => {
      return world.spawn(
        Camera,
        Position(new Vector3(position[0], position[1], position[2])),
        Rotation(new Quaternion(rotation[0], rotation[1], rotation[2], rotation[3]))
      );
    },
  };
});
