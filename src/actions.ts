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
  IsIdle,
  IsThirdPerson,
  IsWalking,
  Item,
  type ItemKind,
  Mining,
  PlaneCollider,
  Player,
  Position,
  Rotation,
  ToolSwing,
  Velocity,
} from './traits';

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

    const intersectsPlayer = world.query(Player, Position, BoxCollider).some((player) => {
      const playerPosition = player.get(Position)!;
      const collider = player.get(BoxCollider)!;

      return (
        Math.abs(playerPosition.x - snappedPosition.x) < (collider.size.x + 1) / 2 &&
        Math.abs(playerPosition.y - snappedPosition.y) < (collider.size.y + 1) / 2 &&
        Math.abs(playerPosition.z - snappedPosition.z) < (collider.size.z + 1) / 2
      );
    });
    if (intersectsPlayer) return;

    return world.spawn(Block, BlockDamage, Position(snappedPosition), BoxCollider);
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
        BoxCollider({ size: new Vector3(0.6, 2, 0.6) })
      );
    },
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
