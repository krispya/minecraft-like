import type { Entity } from 'koota';
import { Vector3 } from 'three';

// Blocks sit on integer x and z with centers at half-integer y, so a block fills the unit cube
// [x - 0.5, x + 0.5] by [floor(y), floor(y) + 1] by [z - 0.5, z + 0.5]. Cells are addressed by the
// integer x and z and the floor of y.
const HALF_SPAN = 1 << 16;
const SPAN = 1 << 17;

export type BlockHit = { entity: Entity; distance: number; normal: Vector3 };

// Spatial index of block entities by cell, for O(1) occupancy and neighborhood lookups.
export class BlockGrid {
  private cells = new Map<number, Entity>();
  private keys = new Map<Entity, number>();

  static key(cx: number, cy: number, cz: number) {
    return ((cx + HALF_SPAN) * SPAN + (cy + HALF_SPAN)) * SPAN + (cz + HALF_SPAN);
  }

  static keyOf(position: Vector3) {
    return BlockGrid.key(Math.round(position.x), Math.floor(position.y), Math.round(position.z));
  }

  get size() {
    return this.cells.size;
  }

  set(entity: Entity, position: Vector3) {
    this.delete(entity);
    const key = BlockGrid.keyOf(position);
    this.cells.set(key, entity);
    this.keys.set(entity, key);
  }

  delete(entity: Entity) {
    const key = this.keys.get(entity);
    if (key === undefined) return;

    this.keys.delete(entity);
    if (this.cells.get(key) === entity) this.cells.delete(key);
  }

  clear() {
    this.cells.clear();
    this.keys.clear();
  }

  at(cx: number, cy: number, cz: number) {
    return this.cells.get(BlockGrid.key(cx, cy, cz));
  }

  isOccupied(position: Vector3) {
    return this.cells.has(BlockGrid.keyOf(position));
  }

  // Marches the ray cell by cell (Amanatides and Woo) and returns the first block that passes the
  // filter, with the world-space normal of the face it entered through. A ray starting inside a
  // block hits it at distance zero with a zero normal.
  raycast(
    origin: Vector3,
    direction: Vector3,
    maxDistance: number,
    filter: (entity: Entity) => boolean
  ): BlockHit | undefined {
    // Shift x and z by a half so every cell is the unit cube [i, i + 1) on all three axes.
    const startX = origin.x + 0.5;
    const startY = origin.y;
    const startZ = origin.z + 0.5;
    let cx = Math.floor(startX);
    let cy = Math.floor(startY);
    let cz = Math.floor(startZ);

    const stepX = Math.sign(direction.x);
    const stepY = Math.sign(direction.y);
    const stepZ = Math.sign(direction.z);
    const deltaX = Math.abs(1 / direction.x);
    const deltaY = Math.abs(1 / direction.y);
    const deltaZ = Math.abs(1 / direction.z);
    // Distance along the ray to the next cell boundary on each axis.
    let nextX = stepX > 0 ? (cx + 1 - startX) * deltaX : (startX - cx) * deltaX;
    let nextY = stepY > 0 ? (cy + 1 - startY) * deltaY : (startY - cy) * deltaY;
    let nextZ = stepZ > 0 ? (cz + 1 - startZ) * deltaZ : (startZ - cz) * deltaZ;

    const normal = new Vector3();
    let distance = 0;
    const maxSteps = Math.ceil(maxDistance) * 3 + 3;

    for (let step = 0; step < maxSteps; step++) {
      const entity = this.at(cx, cy, cz);
      if (entity !== undefined && filter(entity)) return { entity, distance, normal };

      if (nextX < nextY && nextX < nextZ) {
        distance = nextX;
        nextX += deltaX;
        cx += stepX;
        normal.set(-stepX, 0, 0);
      } else if (nextY < nextZ) {
        distance = nextY;
        nextY += deltaY;
        cy += stepY;
        normal.set(0, -stepY, 0);
      } else {
        distance = nextZ;
        nextZ += deltaZ;
        cz += stepZ;
        normal.set(0, 0, -stepZ);
      }

      if (distance > maxDistance) return;
    }
  }
}
