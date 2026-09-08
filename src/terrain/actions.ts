import { createActions, type Entity } from 'koota';
import { random } from 'math/random';
import { Vector3 } from 'three';
import { Camera, Follows } from '../camera/traits';
import { itemActions } from '../item/actions';
import { BoxCollider, Velocity } from '../physics/traits';
import { Player } from '../character/player/traits';
import { Position, Rotation } from '../transform';
import { generateTerrain } from './generate';
import { buildWorld } from './systems';
import { Construction, type DoomedBlock, type PendingBlock, Terrain } from './traits';

// Seconds of reveal cue per block ahead of the player, per block to either side, and per level up
// a column. The world rolls out in front of the camera, fanning out as it goes.
const REVEAL_AHEAD = 0.05;
const REVEAL_ASIDE = 0.025;
const REVEAL_CLIMB = 0.03;
const UP = new Vector3(0, 1, 0);

export const terrainActions = createActions((world) => {
  const { stopMining } = itemActions(world);

  // Horizontal unit vector the player is looking along: the camera's if one follows them.
  const facingDirection = (player: Entity) => {
    const camera = world.queryFirst(Camera, Follows(player), Rotation);
    const rotation = camera?.get(Rotation) ?? player.get(Rotation);
    const forward = new Vector3(0, 0, -1);
    if (rotation) forward.applyQuaternion(rotation);

    forward.projectOnPlane(UP);
    return forward.lengthSq() > 0 ? forward.normalize() : forward.set(0, 0, -1);
  };

  return {
    // Raises a landscape around the player. Pressing again rolls a fresh one in its place.
    // Generation is immediate; spawning follows the reveal sweep frame by frame, see
    // updateConstruction.
    generateWorld: ({ radius = 32, seed = random.int(Math.random, 0, 2 ** 31 - 1) } = {}) => {
      const player = world.queryFirst(Player, Position);
      if (!player) return;

      const origin = player.get(Position)!;
      const centerX = Math.round(origin.x);
      const centerZ = Math.round(origin.z);
      const forward = facingDirection(player);

      // Sweep ahead of the camera and upward. Blocks behind the camera land right away, unseen,
      // and the player's own column lands at once so they stand on it.
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
    },
  };
});
