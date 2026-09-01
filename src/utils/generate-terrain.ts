import type { BlockKindName } from '../traits';
import { createRandom, fbm2D } from './noise';

// Level 1 rests on the ground plane; a block at level n is centered at y = n - 0.5.
export type TerrainBlock = { x: number; level: number; z: number; kind: BlockKindName };
export type Terrain = {
  blocks: TerrainBlock[];
  // Top level of the column, or 0 outside the generated area.
  heightAt: (x: number, z: number) => number;
};

// Share of columns at each level, lowest first. Columns are ranked by noise and dealt out in these
// proportions, so every world is mostly grassland with a few ponds and a snowline on the peaks.
const LEVEL_SHARES = [0.06, 0.15, 0.18, 0.17, 0.14, 0.11, 0.08, 0.06, 0.035, 0.015];
const MAX_HEIGHT = LEVEL_SHARES.length;
// Blocks per noise cell. Larger makes wider, gentler hills.
const HILL_SIZE = 14;
// Lift added to the noise at the center, fading out toward the edge, so the land climbs toward
// the player's column, which is always the summit.
const PEAK_BIAS = 0.8;
const SUMMIT = Number.MAX_SAFE_INTEGER;
// Columns this tall are bare mountain, and the tallest of them wear snow.
const MOUNTAIN_HEIGHT = MAX_HEIGHT - 2;
const SNOW_HEIGHT = MAX_HEIGHT - 1;
const TREE_CHANCE = 0.012;
// Trees keep a clear ring around the player and never crowd each other.
const TREE_CLEARANCE = 2;
const TREE_SPACING = 6;

const columnKey = (x: number, z: number) => `${x},${z}`;

export function generateTerrain({
  centerX,
  centerZ,
  radius,
  seed,
}: {
  centerX: number;
  centerZ: number;
  radius: number;
  seed: number;
}): Terrain {
  const heights = new Map<string, number>();
  const blocks: TerrainBlock[] = [];
  const occupied = new Set<string>();

  const place = (x: number, level: number, z: number, kind: BlockKindName) => {
    const key = `${x},${level},${z}`;
    if (occupied.has(key)) return;

    occupied.add(key);
    blocks.push({ x, level, z, kind });
  };

  const columns: { x: number; z: number; noise: number }[] = [];

  for (let x = centerX - radius; x <= centerX + radius; x++) {
    for (let z = centerZ - radius; z <= centerZ + radius; z++) {
      const isCenter = x === centerX && z === centerZ;
      const falloff = Math.max(1 - Math.hypot(x - centerX, z - centerZ) / radius, 0);
      const lift = PEAK_BIAS * falloff * falloff;
      columns.push({
        x,
        z,
        noise: isCenter ? SUMMIT : fbm2D(x / HILL_SIZE, z / HILL_SIZE, seed) + lift,
      });
    }
  }

  columns.sort((a, b) => a.noise - b.noise);
  columns.forEach(({ x, z }, rank) => {
    const height = levelForRank(rank / columns.length);
    heights.set(columnKey(x, z), height);

    for (let level = 1; level <= height; level++) place(x, level, z, columnKind(height, level));
    // The lowest columns are pond floors.
    if (height === 1) place(x, 2, z, 'water');
  });

  const random = createRandom(seed);
  const trees: [number, number][] = [];

  for (let x = centerX - radius + TREE_CLEARANCE; x <= centerX + radius - TREE_CLEARANCE; x++) {
    for (let z = centerZ - radius + TREE_CLEARANCE; z <= centerZ + radius - TREE_CLEARANCE; z++) {
      const height = heights.get(columnKey(x, z))!;
      if (columnKind(height, height) !== 'grass') continue;
      if (Math.abs(x - centerX) <= TREE_CLEARANCE && Math.abs(z - centerZ) <= TREE_CLEARANCE)
        continue;
      if (random() >= TREE_CHANCE) continue;

      const isCrowded = trees.some(
        ([treeX, treeZ]) => Math.abs(treeX - x) <= TREE_SPACING && Math.abs(treeZ - z) <= TREE_SPACING
      );
      if (isCrowded) continue;

      trees.push([x, z]);
      placeTree(x, height, z, place);
    }
  }

  return { blocks, heightAt: (x, z) => heights.get(columnKey(x, z)) ?? 0 };
}

// Maps a column's rank in [0, 1) to a level by walking the cumulative shares.
function levelForRank(rank: number) {
  let cumulative = 0;
  for (let level = 1; level <= MAX_HEIGHT; level++) {
    cumulative += LEVEL_SHARES[level - 1];
    if (rank < cumulative) return level;
  }
  return MAX_HEIGHT;
}

function columnKind(height: number, level: number): BlockKindName {
  if (height === 1) return 'sand';
  if (height >= MOUNTAIN_HEIGHT) return height >= SNOW_HEIGHT && level === height ? 'snow' : 'stone';
  if (level === height) return 'grass';
  if (level >= height - 2) return 'dirt';
  return 'stone';
}

// A Minecraft oak: four logs, two wide leaf layers, a narrow one, and a cross on top.
function placeTree(
  x: number,
  ground: number,
  z: number,
  place: (x: number, level: number, z: number, kind: BlockKindName) => void
) {
  for (let level = ground + 1; level <= ground + 4; level++) place(x, level, z, 'log');

  for (const level of [ground + 3, ground + 4]) {
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        if (Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;
        place(x + dx, level, z + dz, 'leaves');
      }
    }
  }

  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) place(x + dx, ground + 5, z + dz, 'leaves');
  }

  for (const [dx, dz] of [
    [0, 0],
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]) {
    place(x + dx, ground + 6, z + dz, 'leaves');
  }
}
