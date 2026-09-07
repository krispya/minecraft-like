# 8. The character model

Replace the capsule with the character model. The model has a front, so give the player a rotation and turn it toward the movement input.

Continue in `src/game` from [lesson 7](../07-jump/README.md). The model is already in `public/minecraft-character`.

## 1. Turn toward the input

In `character/traits.ts`, add a turn speed to the controller.

```ts
export const CharacterController = trait({
  // ...
  gravity: -24,
  jumpSpeed: 8,
  // How quickly the character turns toward the input. Higher values turn faster.
  turnSpeed: 10, // <--
});
```

In `character/systems.ts`, import the math and `Rotation`, and keep two scratch values outside the system so it does not allocate every tick.

```ts
import type { World } from 'koota';
import { Quaternion, Vector3 } from 'three'; // <--
import { IsGrounded, Velocity } from '../physics/traits';
import { Time } from '../time/traits';
import { Position, Rotation } from '../transform/traits'; // <--
import { CharacterController, Input } from './traits';

const UP = new Vector3(0, 1, 0); // <--
const targetRotation = new Quaternion(); // <--
```

Add `Rotation` to the query.

```ts
.query(CharacterController, Input, Position, Rotation, Velocity)
.updateEach(([controller, input, position, rotation, velocity], entity) => {
```

After `maxChange`, turn toward the input. **Yaw** is rotation around the vertical axis. `slerp` turns partway toward the target orientation each tick, making the turn smooth.

```ts
// Turn toward the input. Forward input faces -z, which is a yaw of zero.
if (hasInput) {
  const targetYaw = Math.atan2(-input.x, input.y);
  targetRotation.setFromAxisAngle(UP, targetYaw);
  const turnAlpha = 1 - Math.exp(-controller.turnSpeed * delta);
  rotation.slerp(targetRotation, turnAlpha);
}
```

`1 - exp(-speed * delta)` gives the fraction of the remaining turn to cover this tick. It keeps the smoothing consistent across frame rates. With no input, the character keeps its last facing direction.

In `player/actions.ts`, give the player a `Rotation`.

```ts
import { Position, Rotation } from '../transform/traits'; // <--
```

```ts
Position(new Vector3(...position)),
Rotation, // <--
Velocity,
```

## 2. Render the model

Replace `player/renderer.tsx`. The renderer's job is unchanged: one view per player, drawn from its traits.

```tsx
import { useGLTF } from '@react-three/drei/webgpu';
import type { Entity } from 'koota';
import { useQuery, useTrait, useTraitEffect } from 'koota/react';
import { useEffect, useMemo, useState } from 'react';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { Box3, Mesh, type QuaternionTuple, Vector3, type Vector3Tuple } from 'three/webgpu';
import { BoxCollider } from '../physics/traits';
import { Position, Rotation } from '../transform/traits';
import { Player } from './traits';

// Minecraft idle and walking animation by fabizok, licensed CC BY 4.0
// https://sketchfab.com/3d-models/minecraft-idle-and-walking-animation-a3f0270cc1ef42d59be153204d03b0f8
const MODEL_URL = '/minecraft-character/source/model.gltf';

export function PlayerRenderer() {
  const players = useQuery(Player, Position);
  return players.map((entity) => <PlayerView key={entity.id()} entity={entity} />);
}

function PlayerView({ entity }: { entity: Entity }) {
  const { scene } = useGLTF(MODEL_URL);
  // The loaded scene is shared. A skinned mesh needs its bones cloned along with it.
  const model = useMemo(() => clone(scene), [scene]);

  // The entity's Position is the middle of its collider, so shift the model to stand on the
  // collider's bottom, centered.
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

useGLTF.preload(MODEL_URL);
```

`useGLTF` caches the file, so every view gets the same scene and has to copy it. A skinned mesh needs its skeleton copied along with it, which is what `SkeletonUtils.clone` does. The group carries the entity's transform and the model hangs inside it, offset so its feet sit at the bottom of the collider.

## Try it

Open [your practice game](http://localhost:5173/). The model's feet should rest on the ground, and jumping should work as before. Move in different directions: the model smoothly turns toward the input. Its limbs stay still for now.

Lower `turnSpeed` in `character/traits.ts` to `2` and reload. Turning should take longer without changing the path you move along. Next we animate the limbs.

[Run the completed step](http://localhost:5173/?step=8) · [Next, animation →](../09-animation/README.md)
