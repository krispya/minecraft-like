# 11. Mine blocks

Let the player remove blocks as well as place them. A left click adds damage, three hits break a block, and each hit triggers an axe swing in the view.

Continue in `src/game` from [lesson 10](../10-place/README.md). The axe is already in `public/axe.glb`.

## 1. Model damage

In `block/traits.ts`, add `BlockDamage` after `Block`.

```ts
// Hits taken so far, and how many break the block.
export const BlockDamage = trait({ hits: 0, hitsToBreak: 3 });
```

In `block/actions.ts`, import it and give every new block a damage counter.

```ts
import { Block, BlockDamage } from './traits';
```

```ts
return world.spawn(Block, BlockDamage, Position(snapped), BoxCollider);
```

## 2. Model a swing

Create `item/traits.ts`:

```ts
import { trait } from 'koota';

// Duration of one tool swing, in seconds.
export const ToolSwing = trait({ duration: 0.3 });
```

Create `item/actions.ts`. One action does both jobs: it swings the tool and damages the block.

```ts
import { createActions, type Entity } from 'koota';
import { BlockDamage } from '../block/traits';
import { Player } from '../player/traits';
import { ToolSwing } from './traits';

export const itemActions = createActions((world) => ({
  // Swings the player's tool at a block. Each hit adds damage, and the last one breaks it.
  hitBlock: (block: Entity) => {
    const player = world.queryFirst(Player);
    const damage = block.get(BlockDamage);
    if (!player || !damage) return;

    // Removing and adding again restarts the swing and tells onAdd subscribers.
    player.remove(ToolSwing);
    player.add(ToolSwing);

    const hits = damage.hits + 1;
    if (hits >= damage.hitsToBreak) block.destroy();
    else block.set(BlockDamage, { ...damage, hits });
  },
}));
```

Adding `ToolSwing` notifies subscribers and supplies the swing duration. Removing and adding it again lets repeated hits trigger new swings. The trait remains after the animation ends, so it does not mean the player is currently swinging.

`block.destroy()` removes the entity. The block renderer's query then removes its mesh.

Add it to `actions.ts`:

```ts
import { groundActions } from './ground/actions';
import { itemActions } from './item/actions'; // <--
import { playerActions } from './player/actions';
```

```ts
...groundActions(world),
...itemActions(world), // <--
...playerActions(world),
```

## 3. Hit on click

In `block/renderer.tsx`, import the item actions and the damage trait.

```tsx
import { itemActions } from '../item/actions'; // <--
import { Position } from '../transform/traits';
import { blockActions } from './actions';
import { Block, BlockDamage } from './traits'; // <--
```

Inside `BlockView`, read the action and the damage, and add a handler for the left button.

```tsx
const { placeBlock } = useActions(blockActions);
const { hitBlock } = useActions(itemActions); // <--
const position = useTrait(entity, Position);
const damage = useTrait(entity, BlockDamage); // <--
const texture = useTexture('/dirt.jpg');
// Darkens as the block takes hits.
const brightness = damage ? 1 - 0.6 * (damage.hits / damage.hitsToBreak) : 1; // <--

// Left click hits the block with the tool in hand.
const handleHit = (event: ThreeEvent<PointerEvent>) => {
  if (event.button !== 0) return;

  event.stopPropagation();
  hitBlock(entity);
};
```

Attach it, and tint the block by its damage.

```tsx
<mesh
  castShadow
  receiveShadow
  position={position?.toArray()}
  onPointerDown={handleHit}
  onContextMenu={handlePlace}
>
  <boxGeometry />
  <meshStandardMaterial map={texture} color={[brightness, brightness, brightness]} />
</mesh>
```

Try three left clicks on a block. It should darken on the first two and disappear on the third. There is no visible axe yet. Right click still places blocks.

## 4. Put the axe in hand

Create `item/renderer.tsx`. The axe hangs from the character's right arm, so it swings with the animation.

```tsx
import { useGLTF } from '@react-three/drei/webgpu';
import { useMemo } from 'react';
import { Mesh } from 'three/webgpu';

// Minecraft Diamond Axe by Blender3D, licensed CC BY 4.0
// https://sketchfab.com/3d-models/minecraft-diamond-axe-0d62f4d3676545c88ec8523213c055dd
const AXE_URL = '/axe.glb';

// Hangs from the character's right arm joint, gripped the way Minecraft holds a tool.
export function HeldAxe() {
  return (
    <group position={[0, -0.66, -0.04]} rotation={[-2.35, 0, -0.2]} scale={1.25}>
      <group rotation={[0, Math.PI / 1.8, -0.3]} scale={0.5}>
        <Axe />
      </group>
    </group>
  );
}

function Axe() {
  const { scene } = useGLTF(AXE_URL);
  // The loaded scene is shared, so each hand gets its own copy of the object tree.
  const model = useMemo(() => {
    const copy = scene.clone();
    copy.traverse((object) => {
      if (object instanceof Mesh) object.castShadow = true;
    });
    return copy;
  }, [scene]);

  return <primitive object={model} />;
}

useGLTF.preload(AXE_URL);
```

The axe has no skeleton, so a plain `clone` is enough. The numbers on the groups were found by hand.

In `player/renderer.tsx`, add `createPortal`, `useWorld`, `AnimationUtils`, `LoopOnce` and the two item imports.

```tsx
import { useAnimations, useGLTF } from '@react-three/drei/webgpu';
import { createPortal, useFrame } from '@react-three/fiber/webgpu'; // <--
import type { Entity } from 'koota';
import { useQuery, useTag, useTrait, useTraitEffect, useWorld } from 'koota/react'; // <--
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type AnimationAction,
  type AnimationClip,
  AnimationUtils,
  Box3,
  LoopOnce,
  MathUtils,
  Mesh,
  type Object3D,
  type QuaternionTuple,
  Vector3,
  type Vector3Tuple,
} from 'three/webgpu';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { IsWalking } from '../character/traits';
import { HeldAxe } from '../item/renderer'; // <--
import { ToolSwing } from '../item/traits'; // <--
import { BoxCollider, Velocity } from '../physics/traits';
import { Position, Rotation } from '../transform/traits';
import { Player } from './traits';
```

Inside `PlayerView`, find the arm bone and portal the axe into it.

```tsx
useTraitEffect(entity, Rotation, (value) => setRotation(value?.toArray()));
const rightArm = useMemo(() => model.getObjectByName('RightArm'), [model]); // <--
```

```tsx
<group position={position} quaternion={rotation}>
  <primitive object={model} position={modelOffset} />
  {rightArm && createPortal(<HeldAxe />, rightArm, { injectScene: false })}
</group>
```

`createPortal` renders React children into any Three object, here a bone inside the loaded model.

## 5. Play the swing

The model has a `tool_swing` clip. Played on its own it would replace the walk. Made additive, it layers on top of whatever is playing. At the top of `useCharacterAnimation`, replace the `useAnimations` line:

```tsx
const world = useWorld();
// The swing is additive so it layers over whichever clip is playing.
const clips = useMemo(
  () =>
    animations.map((clip) =>
      clip.name === 'tool_swing' ? AnimationUtils.makeClipAdditive(clip.clone()) : clip
    ),
  [animations]
);
const { actions } = useAnimations(clips, model);
```

Before the stride `useFrame`, subscribe to the swing.

```tsx
// Swing once each time a ToolSwing is added to this entity.
useEffect(() => {
  const swing = actions.tool_swing;
  if (!swing) return;

  return world.onAdd(ToolSwing, (swinging) => {
    if (swinging !== entity) return;

    const { duration } = swinging.get(ToolSwing)!;
    swing.reset().setLoop(LoopOnce, 1).setDuration(duration).play();
  });
}, [actions, entity, world]);
```

`world.onAdd` fires when `ToolSwing` is added. The callback checks the entity so only this player's animation plays. It returns an unsubscribe function for effect cleanup. The frame loop keeps handling movement while the subscription starts each swing.

## Try it

Open [your practice game](http://localhost:5173/). The axe should sit in the right hand. Left click a block three times: each click restarts the swing, the first two hits darken the block, and the third removes it. Walk while hitting a block to see the swing layered over the walk.

Set `hitsToBreak` in `block/traits.ts` to `1` and reload to break new blocks in one hit. Hits apply immediately on pointer down, with no reach limit or swing cooldown. Next we reuse the controller for pigs.

[Run the completed step](http://localhost:5173/?step=11) · [Next, pigs →](../12-pig/README.md)
