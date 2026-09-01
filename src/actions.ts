import { createActions, type Entity, type TagTrait } from 'koota';
import { Quaternion, Vector3 } from 'three';
import {
  Block,
  BlockDamage,
  BlockInteraction,
  BlockKind,
  Blocks,
  Construction,
  BoxCollider,
  Camera,
  CarriedBy,
  CharacterController,
  type DoomedBlock,
  Follows,
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
  type PendingBlock,
  Pig,
  PlaneCollider,
  Player,
  Position,
  Rideable,
  Rides,
  Rotation,
  Terrain,
  ToolSwing,
  Velocity,
  Wander,
} from './traits';
import { buildWorld } from './system/update-construction';
import { generateTerrain } from './utils/generate-terrain';

const PLAYER_COLLIDER_SIZE = new Vector3(0.6, 2, 0.6);
// How close a mount has to be to climb on.
const MOUNT_RANGE = 3;
// Seconds of reveal cue per block ahead of the player, per block to either side, and per level up
// a column. The world rolls out in front of the camera, fanning out as it goes.
const REVEAL_AHEAD = 0.05;
const REVEAL_ASIDE = 0.025;
const REVEAL_CLIMB = 0.03;
const UP = new Vector3(0, 1, 0);

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

    if (world.get(Blocks)!.isOccupied(snappedPosition)) return;

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

    return world.spawn(Block, BlockKind, BlockDamage, Position(snappedPosition), BoxCollider);
  };

  const spawnPig = ({ position = [0, 0, 0] } = {}) => {
    return world.spawn(
      Npc,
      Pig,
      Wander,
      Rideable,
      // Faster than the player when ridden. Wander scales the heading down so loose pigs amble.
      CharacterController({ maxSpeed: 7, acceleration: 40, turnSpeed: 6 }),
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

  // Horizontal unit vector the player is looking along: the camera's if one follows them.
  const facingDirection = (player: Entity) => {
    const camera = world.queryFirst(Camera, Follows(player), Rotation);
    const rotation = camera?.get(Rotation) ?? player.get(Rotation);
    const forward = new Vector3(0, 0, -1);
    if (rotation) forward.applyQuaternion(rotation);

    forward.projectOnPlane(UP);
    return forward.lengthSq() > 0 ? forward.normalize() : forward.set(0, 0, -1);
  };

  const stopMining = () => {
    world.query(Mining('*')).forEach((player) => {
      const block = player.targetFor(Mining);
      if (block) player.remove(Mining(block));
    });
  };

  // Raises a landscape around the player. Pressing again rolls a fresh one in its place. Generation
  // is immediate; spawning follows the reveal sweep frame by frame, see updateConstruction.
  const generateWorld = ({ radius = 32, seed = Math.floor(Math.random() * 2 ** 31) } = {}) => {
    const player = world.queryFirst(Player, Position);
    if (!player) return;

    const origin = player.get(Position)!;
    const centerX = Math.round(origin.x);
    const centerZ = Math.round(origin.z);
    const forward = facingDirection(player);

    // Sweep ahead of the camera and upward. Blocks behind the camera land right away, unseen, and
    // the player's own column lands at once so they stand on it.
    const revealDelay = (x: number, level: number, z: number) => {
      const offsetX = x - centerX;
      const offsetZ = z - centerZ;
      if (offsetX === 0 && offsetZ === 0) return 0;

      const ahead = Math.max(offsetX * forward.x + offsetZ * forward.z, 0);
      const aside = Math.abs(offsetX * forward.z - offsetZ * forward.x);
      return ahead * REVEAL_AHEAD + aside * REVEAL_ASIDE + (level - 1) * REVEAL_CLIMB;
    };
    const byDelay = (a: { delay: number }, b: { delay: number }) => a.delay - b.delay;

    stopMining();

    // The old world goes as the sweep reaches it.
    const doomed: DoomedBlock[] = world.query(Terrain, Position).map((block) => {
      const { x, y, z } = block.get(Position)!;
      return { entity: block, delay: revealDelay(x, Math.round(y + 0.5), z) };
    });

    const terrain = generateTerrain({ centerX, centerZ, radius, seed });
    const pending: PendingBlock[] = terrain.blocks.map(({ x, level, z, kind }) => ({
      x,
      y: level - 0.5,
      z,
      kind,
      delay: revealDelay(x, level, z),
    }));

    world.set(Construction, {
      pending: pending.sort(byDelay),
      doomed: doomed.sort(byDelay),
      nextPending: 0,
      nextDoomed: 0,
      elapsed: 0,
    });
    // The ground under and around the player exists before this frame ends.
    buildWorld(world);

    // Stand every moving body on top of its new column. Riders follow their mounts.
    world.query(Position, Velocity, BoxCollider).forEach((body) => {
      const position = body.get(Position)!;
      const { size } = body.get(BoxCollider)!;
      const top = terrain.heightAt(Math.round(position.x), Math.round(position.z)) + size.y / 2;
      if (position.y >= top) return;

      position.y = top;
      body.changed(Position);
    });
  };

  const transitionCharacter = (entity: Entity, state: TagTrait) => {
    if (entity.has(state)) return;

    entity.remove(IsIdle, IsWalking, IsAirborne, IsRiding);
    entity.add(state);
  };

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

  // Mounting moves the rider, so input only asks for it here and the tick carries it out. That
  // way the camera follows in the same frame instead of one frame after the model.
  const requestMountToggle = () => {
    const player = world.queryFirst(Player, Input);
    if (!player) return;

    player.set(Input, { mount: true });
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

  // Lands the first hit right away. The swing loop keeps hitting while the button is held.
  const startMining = (block: Entity, point: Vector3) => {
    const player = world.queryFirst(Player);
    if (!player || !mineBlock(block, point) || !world.has(block)) return;

    player.add(Mining(block));
  };

  const placeBlock = (surface: Entity, hit: { point: Vector3; normal: Vector3 }) => {
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
  };

  const equipItem = (holder: Entity, item: Entity) => {
    world.query(HeldBy(holder)).forEach((held) => held.remove(HeldBy(holder)));
    item.add(HeldBy(holder));
  };

  // Puts the carried item of a kind in hand, like picking a hotbar slot.
  const selectItem = (holder: Entity, kind: ItemKind) => {
    const item = world
      .query(Item, CarriedBy(holder))
      .find((candidate) => candidate.get(Item)!.kind === kind);
    if (item) equipItem(holder, item);
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
    requestMountToggle,
    toggleMount,
    generateWorld,
    transitionCharacter,
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
    giveItem: (holder: Entity, item: Entity) => {
      item.add(CarriedBy(holder));
    },
    equipItem,
    selectItem,
    selectPlayerItem: (kind: ItemKind) => {
      const player = world.queryFirst(Player);
      if (player) selectItem(player, kind);
    },
    swingTool,
    spawnBlockAt,
    mineBlock,
    startMining,
    stopMining,
    placeBlock,
    // The primary button does whatever the item in hand does: the hammer mines a block, a block
    // is placed against the surface.
    interactWith: (surface: Entity, hit: { point: Vector3; normal: Vector3 }) => {
      const player = world.queryFirst(Player);
      const held = player && world.queryFirst(Item, HeldBy(player));

      switch (held?.get(Item)?.kind) {
        case 'hammer':
          if (surface.has(Block)) startMining(surface, hit.point);
          break;
        case 'block':
          placeBlock(surface, hit);
          break;
      }
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
