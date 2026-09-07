# 12. Pigs

Add pigs that choose their own movement. They use the same controller and physics as the player, with different settings and a timer that writes their `Input`.

Continue in `src/game` from [lesson 11](../11-mine/README.md). The model is already in `public/minecraft-saddled-pig`.

## 1. Model a pig

Create `pig/traits.ts`:

```ts
import { trait } from 'koota';
import { Vector2 } from 'three';

export const Pig = trait();

// A random stroll: rest for a while, then walk in a random direction for a while.
export const Wander = trait({
  // Direction in Input space, or zero while resting.
  heading: () => new Vector2(),
  // Seconds left in the current rest or walk.
  timer: 0,
  minRest: 1,
  maxRest: 4,
  minWalk: 1,
  maxWalk: 3,
  // Fraction of the controller's max speed to amble at.
  speed: 0.25,
});
```

Anything with `Wander` strolls, whether or not it is a pig.

Create `pig/actions.ts`. `spawnPig` uses the same movement traits as `spawnPlayer`, with a smaller collider and different speeds. `Wander` supplies directions without keyboard input.

```ts
import { createActions } from 'koota';
import { Vector3 } from 'three';
import { CharacterController, Input, IsIdle } from '../character/traits';
import { BoxCollider, Velocity } from '../physics/traits';
import { Position, Rotation } from '../transform/traits';
import { Pig, Wander } from './traits';

export const pigActions = createActions((world) => {
  const spawnPig = (position: Vector3) => {
    return world.spawn(
      Pig,
      Wander,
      // Same controller as the player, tuned for a pig. Wander scales the heading down so a
      // loose pig ambles.
      CharacterController({ maxSpeed: 7, acceleration: 40, turnSpeed: 6 }),
      IsIdle,
      Input,
      Position(position.clone()),
      Rotation,
      Velocity,
      // A box around the pig.
      BoxCollider({ size: new Vector3(0.9, 0.9, 0.9) })
    );
  };

  return {
    spawnPig,
    // Drops a pig a few units from a spot, in a random direction.
    spawnPigNear: (position: Vector3, { minDistance = 2, maxDistance = 4 } = {}) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = minDistance + Math.random() * (maxDistance - minDistance);

      return spawnPig(
        new Vector3(
          position.x + Math.cos(angle) * distance,
          position.y + 1,
          position.z + Math.sin(angle) * distance
        )
      );
    },
  };
});
```

Add it to `actions.ts`:

```ts
import { itemActions } from './item/actions';
import { pigActions } from './pig/actions'; // <--
import { playerActions } from './player/actions';
```

```ts
...itemActions(world),
...pigActions(world), // <--
...playerActions(world),
```

## 2. Alternate walking and resting

Create `pig/systems.ts`. Where `updatePlayerInput` reads keys, this reads a timer.

```ts
import type { World } from 'koota';
import { Input } from '../character/traits';
import { Time } from '../time/traits';
import { Wander } from './traits';

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

// A pig's mind. It writes Input just like the keyboard does for the player.
export function updateWanderInput(world: World) {
  const { delta } = world.get(Time)!;

  world.query(Wander, Input).updateEach(([wander, input]) => {
    const isWalking = wander.heading.lengthSq() > 0;
    wander.timer -= delta;

    // Time to switch: walkers rest, and resters pick a new direction to walk.
    if (wander.timer <= 0) {
      if (isWalking) {
        wander.heading.set(0, 0);
        wander.timer = randomBetween(wander.minRest, wander.maxRest);
      } else {
        const angle = randomBetween(0, Math.PI * 2);
        wander.heading.set(Math.cos(angle), Math.sin(angle)).multiplyScalar(wander.speed);
        wander.timer = randomBetween(wander.minWalk, wander.maxWalk);
      }
    }

    input.x = wander.heading.x;
    input.y = wander.heading.y;
    input.jump = false;
  });
}
```

When the timer runs out, a walking pig rests and a resting pig picks a direction. `Wander.speed` scales the input, so `0.25` of the controller's speed of `7` gives a top speed of `1.75` units per second.

The existing controller, collisions and state system handle the rest. This does not add pathfinding or collisions between moving characters.

In `frameloop.tsx`, run it beside the player's input.

```tsx
import { updateWanderInput } from './pig/systems'; // <--
```

```tsx
updatePlayerInput(world);
updateWanderInput(world); // <--
updateCharacterController(world);
```

## 3. Render the pig

Create `pig/renderer.tsx`. As with the player, clone the model, align it with the collider and read its transform. The pig has one walk clip, which fades out while resting.

```tsx
import { useAnimations, useGLTF } from '@react-three/drei/webgpu';
import { useFrame } from '@react-three/fiber/webgpu';
import type { Entity } from 'koota';
import { useQuery, useTag, useTrait, useTraitEffect } from 'koota/react';
import { useEffect, useMemo, useState } from 'react';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import {
  Box3,
  MathUtils,
  Mesh,
  type QuaternionTuple,
  Vector3,
  type Vector3Tuple,
} from 'three/webgpu';
import { IsWalking } from '../character/traits';
import { BoxCollider, Velocity } from '../physics/traits';
import { Position, Rotation } from '../transform/traits';
import { Pig } from './traits';

// Minecraft Saddled Pig by Nasabeat, licensed CC BY 4.0
// https://sketchfab.com/3d-models/minecraft-saddled-pig-22a686ae544e41bfa640bc757e61d7a9
const MODEL_URL = '/minecraft-saddled-pig/source/model.gltf';

export function PigRenderer() {
  const pigs = useQuery(Pig, Position);
  return pigs.map((entity) => <PigView key={entity.id()} entity={entity} />);
}

function PigView({ entity }: { entity: Entity }) {
  const { scene, animations } = useGLTF(MODEL_URL);
  const model = useMemo(() => clone(scene), [scene]);

  const box = useTrait(entity, BoxCollider);
  const modelOffset = useMemo(() => {
    const bounds = new Box3().setFromObject(model);
    const center = bounds.getCenter(new Vector3());

    return [-center.x, -bounds.min.y - (box?.size.y ?? 0) / 2, -center.z] as const;
  }, [box, model]);

  const [position, setPosition] = useState<Vector3Tuple>();
  useTraitEffect(entity, Position, (value) => setPosition(value?.toArray()));
  const [rotation, setRotation] = useState<QuaternionTuple>();
  useTraitEffect(entity, Rotation, (value) => setRotation(value?.toArray()));

  usePigAnimation(entity, animations, model);

  useEffect(() => {
    model.traverse((object) => {
      if (!(object instanceof Mesh)) return;

      object.castShadow = true;
      object.receiveShadow = true;
    });
  }, [model]);

  return (
    <group position={position} quaternion={rotation}>
      <primitive object={model} position={modelOffset} />
    </group>
  );
}

// Fade the pig's walk clip in and out with the walking state.
function usePigAnimation(
  entity: Entity,
  animations: Parameters<typeof useAnimations>[0],
  model: Parameters<typeof useAnimations>[1]
) {
  const { actions } = useAnimations(animations, model);
  const isWalking = useTag(entity, IsWalking);

  useEffect(() => {
    const walk = actions['animation.pig.walk'];
    if (!walk) return;

    if (isWalking) walk.reset().fadeIn(0.15).play();
    else walk.fadeOut(0.15);
  }, [actions, isWalking]);

  // Match the trot to the speed. One cycle covers about a unit and a half of ground.
  useFrame(() => {
    const walk = actions['animation.pig.walk'];
    const velocity = entity.get(Velocity);
    if (!walk || !velocity) return;

    const horizontalSpeed = Math.hypot(velocity.x, velocity.z);
    const cyclesPerSecond = horizontalSpeed / 1.5;
    walk.timeScale = MathUtils.clamp(cyclesPerSecond * walk.getClip().duration, 1, 4);
  });
}

useGLTF.preload(MODEL_URL);
```

In `app.tsx`, add it to the scene.

```tsx
import { PigRenderer } from './pig/renderer'; // <--
import { PlayerRenderer } from './player/renderer';
```

```tsx
<PlayerRenderer />
<PigRenderer /> {/* <-- */}
<GroundRenderer />
```

## 4. Spawn pigs

In `world.ts`, spawn two next to the player.

```ts
import { Time } from './time/traits';
import { Position } from './transform/traits'; // <--
```

```ts
const { spawnPlayer, spawnCamera, spawnGround, spawnBlockAt, spawnPigNear } = actions(world); // <--
```

```ts
const camera = spawnCamera();
camera.add(Follows(player));
// Some company. Press R for more.
spawnPigNear(player.get(Position)!); // <--
spawnPigNear(player.get(Position)!); // <--
```

A key press should spawn more. Holding a key is state and lives in `Keys`, but a press is an event, so it fires an action from the hook. In `input/hooks.ts`, import what it needs.

```ts
import type { World } from 'koota';
import { useEffect } from 'react';
import { actions } from '../actions'; // <--
import { Player } from '../player/traits'; // <--
import { Position } from '../transform/traits'; // <--
import { Keys, Pointer, Wheel } from './traits';
```

Inside `useKeyboard`, read the action and replace `handleKeyDown`.

```ts
const keys = world.get(Keys)!;
const { spawnPigNear } = actions(world); // <--
```

```ts
const handleKeyDown = (event: KeyboardEvent) => {
  const key = event.key.toLowerCase();

  // A press is an event, not a state, so it fires an action here rather than in a system.
  if (key === 'r' && !keys.has(key)) {
    const position = world.queryFirst(Player, Position)?.get(Position);
    if (position) spawnPigNear(position);
  }

  setKey(key, true);
};
```

## Try it

Open [your practice game](http://localhost:5173/). Two pigs fall to the ground, wander and pause to rest. Press R once to add one pig. Holding R should not keep spawning them.

Build a wall across a pig's path. It should stop at the wall, rest when its walk timer expires, then choose another random direction. Increase `minRest` and `maxRest` in `pig/traits.ts` and reload to see longer pauses.

The same controller now moves a player and pigs. Try adding another creature by defining its traits, input system and renderer.

[Run the completed step](http://localhost:5173/?step=12) · [Back to overview](../../../README.md)
