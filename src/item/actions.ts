import { createActions, type Entity } from 'koota';
import { Vector3 } from 'three';
import { blockActions } from '../block/actions';
import { Block, BlockDamage } from '../block/traits';
import { PlaneCollider } from '../physics/traits';
import { Player } from '../character/player/traits';
import { Position } from '../transform';
import {
  BlockInteraction,
  CarriedBy,
  HeldBy,
  Item,
  type ItemKind,
  Mining,
  ToolSwing,
} from './traits';

export const itemActions = createActions((world) => {
  const { spawnBlockAt } = blockActions(world);

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

  const stopMining = () => {
    world.query(Mining('*')).forEach((player) => {
      const block = player.targetFor(Mining);
      if (block) player.remove(Mining(block));
    });
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
  };
});
