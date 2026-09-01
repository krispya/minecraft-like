import type { Entity, World } from 'koota';
import {
  BoxGeometry,
  Color,
  Group,
  InstancedMesh,
  type Intersection,
  type Material,
  Matrix4,
  Quaternion,
  type Raycaster,
  Vector3,
} from 'three';
import type { BlockGrid } from '../block-grid';
import { BLOCK_KINDS, isSolidBlock } from '../blocks';
import {
  Block,
  BlockDamage,
  BlockKind,
  type BlockKindName,
  Blocks,
  BoxCollider,
  Position,
  Reveal,
} from '../traits';
import { onAllAdded } from '../utils/on-all-added';
import { type BlockTextures, getBlockMaterial } from './block-materials';

export type BlockIntersection = Intersection & { block: Entity };

// Every block shares one unit cube; each kind is one instanced mesh, one draw call per material.
const unitCube = new BoxGeometry();
const INITIAL_CAPACITY = 4096;
// How far below its resting spot a block starts rising from.
const RISE_DISTANCE = 2;
// Blocks further than this from the camera cannot be picked.
const PICK_DISTANCE = 64;
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

const NO_ROTATION = new Quaternion();
const matrix = new Matrix4();
const translation = new Vector3();
const scale = new Vector3();
const color = new Color();
const noRaycast = () => {};

type Slot = { kind: BlockKindName; index: number };

// The instances of one kind, packed densely so removal swaps the last instance into the hole.
class KindBatch {
  readonly kind: BlockKindName;
  mesh: InstancedMesh;
  entities: Entity[] = [];
  private material: Material | Material[];
  private group: Group;

  constructor(kind: BlockKindName, material: Material | Material[], group: Group) {
    this.kind = kind;
    this.material = material;
    this.group = group;
    this.mesh = this.createMesh(INITIAL_CAPACITY);
  }

  get capacity() {
    return this.mesh.instanceMatrix.count;
  }

  private createMesh(capacity: number) {
    const mesh = new InstancedMesh(unitCube, this.material, capacity);
    mesh.count = 0;
    // Instances span the whole world, so cull per frame rather than by a stale bounding sphere.
    mesh.frustumCulled = false;
    mesh.castShadow = isSolidBlock(this.kind);
    mesh.receiveShadow = true;
    // Picking goes through the block grid on the parent group instead.
    mesh.raycast = noRaycast;
    this.group.add(mesh);
    return mesh;
  }

  grow() {
    const old = this.mesh;
    const mesh = this.createMesh(old.instanceMatrix.count * 2);
    mesh.instanceMatrix.array.set(old.instanceMatrix.array);
    if (old.instanceColor) {
      mesh.setColorAt(0, color.setScalar(1));
      mesh.instanceColor!.array.set(old.instanceColor.array);
    }
    mesh.count = old.count;

    this.group.remove(old);
    old.dispose();
    this.mesh = mesh;
  }
}

// Mirrors block entities into instanced meshes, and picks blocks by marching the block grid.
export class BlockBatch {
  readonly group = new Group();
  private batches = new Map<BlockKindName, KindBatch>();
  private slots = new Map<Entity, Slot>();

  constructor(textures: BlockTextures) {
    for (const kind of BLOCK_KINDS) {
      this.batches.set(kind, new KindBatch(kind, getBlockMaterial(kind, textures), this.group));
    }
  }

  // Follows the world's blocks until the returned function is called.
  subscribe(world: World) {
    const grid = world.get(Blocks)!;
    this.group.raycast = (raycaster, intersects) => this.raycast(grid, raycaster, intersects);

    world.query(Block, BlockKind, Position).forEach(this.add);
    const unsubscribe = [
      onAllAdded(world, [Block, BlockKind, Position], this.add),
      world.onRemove(Block, this.remove),
      world.onChange(BlockDamage, this.updateDamage),
      // A block may get its cue after it is added, and drops the cue once fully risen.
      world.onAdd(Reveal, this.updateReveal),
      world.onRemove(Reveal, this.settle),
    ];

    // The meshes stay attached so a resubscribe (as under StrictMode) starts from an empty batch.
    return () => {
      unsubscribe.forEach((stop) => stop());
      this.clear();
    };
  }

  // Advances every block that is still rising.
  animate(world: World) {
    world.query(Reveal, Block).forEach(this.updateReveal);
  }

  clear() {
    this.batches.forEach((batch) => {
      batch.mesh.count = 0;
      batch.entities.length = 0;
    });
    this.slots.clear();
  }

  private add = (entity: Entity) => {
    if (this.slots.has(entity)) return;

    const kind = entity.get(BlockKind)!.kind;
    const batch = this.batches.get(kind)!;
    if (batch.mesh.count >= batch.capacity) batch.grow();

    const index = batch.mesh.count++;
    batch.entities[index] = entity;
    this.slots.set(entity, { kind, index });

    this.updateReveal(entity);
    this.updateDamage(entity);
  };

  private remove = (entity: Entity) => {
    const slot = this.slots.get(entity);
    if (!slot) return;

    const batch = this.batches.get(slot.kind)!;
    const { mesh } = batch;
    const last = mesh.count - 1;

    if (slot.index !== last) {
      const moved = batch.entities[last];
      mesh.getMatrixAt(last, matrix);
      mesh.setMatrixAt(slot.index, matrix);
      if (mesh.instanceColor) {
        mesh.getColorAt(last, color);
        mesh.setColorAt(slot.index, color);
        mesh.instanceColor.needsUpdate = true;
      }
      batch.entities[slot.index] = moved;
      this.slots.get(moved)!.index = slot.index;
    }

    batch.entities.length = last;
    mesh.count = last;
    mesh.instanceMatrix.needsUpdate = true;
    this.slots.delete(entity);
  };

  private updateReveal = (entity: Entity) => {
    const slot = this.slots.get(entity);
    const rest = entity.get(Position);
    if (!slot || !rest) return;

    const cue = entity.get(Reveal);
    const t = cue ? Math.min(Math.max((cue.elapsed - cue.delay) / cue.duration, 0), 1) : 1;
    const progress = easeOutCubic(t);
    this.setTransform(slot, rest, rest.y - RISE_DISTANCE * (1 - progress), progress);
  };

  // Lands the block exactly at rest once its cue is over.
  private settle = (entity: Entity) => {
    const slot = this.slots.get(entity);
    const rest = entity.get(Position);
    if (!slot || !rest) return;

    this.setTransform(slot, rest, rest.y, 1);
  };

  private updateDamage = (entity: Entity) => {
    const slot = this.slots.get(entity);
    if (!slot) return;

    // Darkens as the block takes hits.
    const damage = entity.get(BlockDamage);
    const brightness = damage ? 1 - 0.6 * (damage.hits / damage.hitsToBreak) : 1;
    const { mesh } = this.batches.get(slot.kind)!;
    mesh.setColorAt(slot.index, color.setScalar(brightness));
    mesh.instanceColor!.needsUpdate = true;
  };

  private setTransform(slot: Slot, rest: Vector3, y: number, size: number) {
    const { mesh } = this.batches.get(slot.kind)!;
    matrix.compose(translation.set(rest.x, y, rest.z), NO_ROTATION, scale.setScalar(size));
    mesh.setMatrixAt(slot.index, matrix);
    mesh.instanceMatrix.needsUpdate = true;
  }

  // One march through the grid per pointer event, in place of raycasting every block. Blocks
  // without a collider, like water, are see-through to the pointer as well.
  private raycast(grid: BlockGrid, raycaster: Raycaster, intersects: Intersection[]) {
    const { ray, far } = raycaster;
    const hit = grid.raycast(ray.origin, ray.direction, Math.min(far, PICK_DISTANCE), (entity) =>
      entity.has(BoxCollider)
    );
    if (!hit) return;

    const intersection: BlockIntersection = {
      distance: hit.distance,
      point: ray.at(hit.distance, new Vector3()),
      object: this.group,
      face: { a: 0, b: 0, c: 0, normal: hit.normal, materialIndex: 0 },
      block: hit.entity,
    };
    intersects.push(intersection);
  }
}
