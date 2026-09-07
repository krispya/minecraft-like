# 10. Place blocks

Give the player something to build. Right click to place blocks on a grid, then add collisions so the player can jump onto them.

Continue in `src/game` from [lesson 9](../09-animation/README.md).

## 1. Model a block

Create `block/traits.ts`:

```ts
import { trait } from 'koota'

export const Block = trait()
```

A block is a tag plus the traits it shares with everything else: a `Position` and a `BoxCollider`. The grid is not stored anywhere. It is a rule about which positions a block may have.

## 2. Spawn on the grid

Create `block/actions.ts` with two actions. `spawnBlockAt` snaps a position to the grid and rejects occupied cells. `placeBlock` chooses the cell beside the clicked face, then calls `spawnBlockAt`.

Blocks are one unit wide. Their centers use whole numbers on `x` and `z`, and half units on `y`, so the first layer rests on the floor.

```ts
import { createActions, type Entity } from 'koota'
import { Vector3 } from 'three'
import { BoxCollider, Velocity } from '../physics/traits'
import { Position } from '../transform/traits'
import { Block } from './traits'

export const blockActions = createActions((world) => {
  // Blocks fill unit cells: whole numbers on x and z, and halves on y so they sit on the ground.
  const spawnBlockAt = (position: Vector3) => {
    const snapped = new Vector3(
      Math.round(position.x),
      Math.round(position.y - 0.5) + 0.5,
      Math.round(position.z)
    )

    const isOccupied = world
      .query(Block, Position)
      .some((block) => block.get(Position)!.equals(snapped))
    if (isOccupied) return

    // A block cannot appear inside anything that moves, like the player.
    const intersectsBody = world.query(Velocity, Position, BoxCollider).some((body) => {
      const bodyPosition = body.get(Position)!
      const { size } = body.get(BoxCollider)!

      return (
        Math.abs(bodyPosition.x - snapped.x) < (size.x + 1) / 2 &&
        Math.abs(bodyPosition.y - snapped.y) < (size.y + 1) / 2 &&
        Math.abs(bodyPosition.z - snapped.z) < (size.z + 1) / 2
      )
    })
    if (intersectsBody) return

    return world.spawn(Block, Position(snapped), BoxCollider)
  }

  return {
    spawnBlockAt,
    // Puts a block against the surface that was clicked, on the side that was hit.
    placeBlock: (surface: Entity, hit: { point: Vector3; normal: Vector3 }) => {
      const position = hit.point.clone()

      if (surface.has(Block)) {
        // Step one cell along whichever axis the face mostly points.
        const x = Math.abs(hit.normal.x)
        const y = Math.abs(hit.normal.y)
        const z = Math.abs(hit.normal.z)
        const offset = new Vector3()

        if (x >= y && x >= z) offset.x = Math.sign(hit.normal.x)
        else if (y >= z) offset.y = Math.sign(hit.normal.y)
        else offset.z = Math.sign(hit.normal.z)

        position.copy(surface.get(Position)!).add(offset)
      } else {
        // The ground is a floor, so the block goes half a unit up from where it was hit.
        position.y += 0.5
      }

      return spawnBlockAt(position)
    },
  }
})
```

The view supplies the hit surface, point and normal. The action decides where the block belongs and whether it fits. That keeps placement rules in the simulation.

Add it to `actions.ts`:

```ts
import { createActions } from 'koota'
import { blockActions } from './block/actions' // <--
import { cameraActions } from './camera/actions'
```

```ts
export const actions = createActions((world) => ({
  ...blockActions(world), // <--
  ...cameraActions(world),
  ...characterActions(world),
  ...groundActions(world),
  ...playerActions(world),
}))
```

## 3. Render and click

Create `block/renderer.tsx`. A block is a textured cube that answers a right click.

```tsx
import { useTexture } from '@react-three/drei/webgpu'
import type { ThreeEvent } from '@react-three/fiber/webgpu'
import type { Entity } from 'koota'
import { useActions, useQuery, useTrait } from 'koota/react'
import { Position } from '../transform/traits'
import { blockActions } from './actions'
import { Block } from './traits'

export function BlockRenderer() {
  const blocks = useQuery(Block, Position)
  return blocks.map((entity) => <BlockView key={entity.id()} entity={entity} />)
}

function BlockView({ entity }: { entity: Entity }) {
  const { placeBlock } = useActions(blockActions)
  const position = useTrait(entity, Position)
  const texture = useTexture('/dirt.jpg')

  // Right click places a block against the face under the pointer.
  const handlePlace = (event: ThreeEvent<MouseEvent>) => {
    event.nativeEvent.preventDefault()
    event.stopPropagation()
    if (event.face) placeBlock(entity, { point: event.point, normal: event.face.normal })
  }

  return (
    <mesh castShadow receiveShadow position={position?.toArray()} onContextMenu={handlePlace}>
      <boxGeometry />
      <meshStandardMaterial map={texture} />
    </mesh>
  )
}
```

Fiber casts a ray through the pointer to find the clicked surface. `event.point` is the hit position in the world. `event.face.normal` points out from the face in the mesh's local coordinates. Our blocks have no rotation, so those directions also match the world axes. Ground placement only uses the hit point.

`preventDefault` hides the browser's context menu. `stopPropagation` keeps the same click from also placing a block on a surface behind this one.

The ground takes the same click. In `ground/renderer.tsx`, import the pieces.

```tsx
import { useTexture } from '@react-three/drei/webgpu'
import type { ThreeEvent } from '@react-three/fiber/webgpu' // <--
import type { Entity } from 'koota'
import { useActions, useQueryFirst, useTrait } from 'koota/react' // <--
import { RepeatWrapping } from 'three/webgpu'
import { blockActions } from '../block/actions' // <--
```

Inside `GroundView`, read the action and add the handler before `return`.

```tsx
const { placeBlock } = useActions(blockActions) // <--
const texture = useTexture('/grass.jpg')
```

```tsx
// Right click places a block on the ground under the pointer.
const handlePlace = (event: ThreeEvent<MouseEvent>) => {
  event.nativeEvent.preventDefault()
  event.stopPropagation()
  if (event.face) placeBlock(entity, { point: event.point, normal: event.face.normal })
}
```

Attach it to the mesh.

```tsx
<mesh
  receiveShadow
  position={position?.toArray()}
  rotation-x={-Math.PI / 2}
  onContextMenu={handlePlace}
>
```

In `app.tsx`, add the renderer to the scene.

```tsx
import { BlockRenderer } from './block/renderer' // <--
import { CameraRenderer } from './camera/renderer'
```

```tsx
<PlayerRenderer />
<GroundRenderer />
<BlockRenderer /> {/* <-- */}
<CameraRenderer />
```

Open your practice game and right click the ground, then the top or side of the new block. Blocks should line up on the grid. Walk through one: placement works, but its collider needs a collision system.

## 4. Make blocks solid

A block with a collider is only solid if a system says so. In `physics/systems.ts`, update the imports.

```ts
import { Not, type World } from 'koota' // <--
import type { Vector3 } from 'three' // <--
import { Position } from '../transform/traits'
import { BoxCollider, IsGrounded, PlaneCollider, Velocity } from './traits'
```

Append the collision code. `resolveOverlap` measures overlap on each axis and pushes the moving box out along the smallest one. `resolveBoxCollisions` applies that rule to each moving body and each stationary block.

```ts
// Pushes the body out of the box along the axis it overlaps least, the shortest way out. Returns
// whether the body ended up standing on the box.
function resolveOverlap(
  position: Vector3,
  velocity: Vector3,
  size: Vector3,
  otherPosition: Vector3,
  otherSize: Vector3
) {
  const deltaX = position.x - otherPosition.x
  const deltaY = position.y - otherPosition.y
  const deltaZ = position.z - otherPosition.z
  const overlapX = (size.x + otherSize.x) / 2 - Math.abs(deltaX)
  const overlapY = (size.y + otherSize.y) / 2 - Math.abs(deltaY)
  const overlapZ = (size.z + otherSize.z) / 2 - Math.abs(deltaZ)

  if (overlapX < 0 || overlapY < 0 || overlapZ < 0) return false

  if (overlapY <= overlapX && overlapY <= overlapZ) {
    const direction = deltaY < 0 ? -1 : 1
    position.y += overlapY * direction
    if (velocity.y * direction < 0) velocity.y = 0
    return direction > 0
  }

  if (overlapX <= overlapZ) {
    const direction = deltaX < 0 ? -1 : 1
    position.x += overlapX * direction
    if (velocity.x * direction < 0) velocity.x = 0
  } else {
    const direction = deltaZ < 0 ? -1 : 1
    position.z += overlapZ * direction
    if (velocity.z * direction < 0) velocity.z = 0
  }

  return false
}

// Keeps moving boxes out of the boxes that stay put, like blocks.
export function resolveBoxCollisions(world: World) {
  const obstacles = world.query(Position, BoxCollider, Not(Velocity))

  world.query(Position, Velocity, BoxCollider).updateEach(([position, velocity, box], entity) => {
    let isGrounded = entity.has(IsGrounded)

    obstacles.forEach((obstacle) => {
      const landed = resolveOverlap(
        position,
        velocity,
        box.size,
        obstacle.get(Position)!,
        obstacle.get(BoxCollider)!.size
      )
      if (landed) isGrounded = true
    })

    if (isGrounded) entity.add(IsGrounded)
  })
}
```

Two boxes overlap when they overlap on all three axes. The way out is along the axis where the overlap is smallest, and a push upward counts as landing. `Not(Velocity)` picks out the boxes that never move, which so far is every block.

In `frameloop.tsx`, run it after floor collisions and before character state. The floor check clears `IsGrounded` when the player is above the floor. The block check restores it when the player stands on a block.

```tsx
import { resolveBoxCollisions, resolveBoxPlaneCollisions } from './physics/systems' // <--
```

```tsx
resolveBoxPlaneCollisions(world)
resolveBoxCollisions(world) // <--
updateCharacterState(world)
```

In `world.ts`, spawn one block to build from.

```ts
import { createWorld } from 'koota'
import { Vector3 } from 'three' // <--
```

```ts
const { spawnPlayer, spawnCamera, spawnGround, spawnBlockAt } = actions(world) // <--
spawnGround()
// One block to build from.
spawnBlockAt(new Vector3(0, 0.5, -3)) // <--
```

## Try it

Open [your practice game](http://localhost:5173/). One block is already on the ground. Walk into it: it stops you. Jump onto the single block, then build steps one block higher at a time to climb farther. A two-block-high wall is too tall to clear from the ground.

Right click the ground to build, or a block's face to place beside it. Try placing where the player stands: the action rejects it. Next we add mining.

[Run the completed step](http://localhost:5173/?step=10) · [Next, mine →](../11-mine/README.md)
