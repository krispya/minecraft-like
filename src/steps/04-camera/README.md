# 4. The camera entity

Orbiting and following a player both change the camera. Give it a position and rotation in the simulation, then let a renderer apply them to the scene's camera.

Continue in `src/game` from [lesson 3](../03-player/README.md).

## 1. Add rotation

A camera needs to face somewhere. In `transform/traits.ts`, add `Rotation` after `Position`.

```ts
import { trait } from 'koota';
import { Quaternion, Vector3 } from 'three'; // <--

export const Position = trait(() => new Vector3());
export const Rotation = trait(() => new Quaternion()); // <--
```

A **quaternion** represents an orientation in 3D. We will use Three's helpers to build one from the direction the camera should face.

## 2. Spawn the camera

Create `camera/traits.ts`:

```ts
import { trait } from 'koota';

export const Camera = trait();
```

Create `camera/actions.ts`. The action takes a position and a point to look at, and turns that into a rotation.

```ts
import { createActions } from 'koota';
import { Matrix4, Quaternion, Vector3 } from 'three';
import { Position, Rotation } from '../transform/traits';
import { Camera } from './traits';

export const cameraActions = createActions((world) => ({
  spawnCamera: ({ position = [0, 0, 0], target = [0, 0, 0] } = {}) => {
    const eye = new Vector3(...position);
    // A rotation is a quaternion. Build it from the direction the camera should face.
    const lookAt = new Matrix4().lookAt(eye, new Vector3(...target), new Vector3(0, 1, 0));
    const rotation = new Quaternion().setFromRotationMatrix(lookAt);

    return world.spawn(Camera, Position(eye), Rotation(rotation));
  },
}));
```

Add it to `actions.ts`:

```ts
import { createActions } from 'koota';
import { cameraActions } from './camera/actions'; // <--
import { playerActions } from './player/actions';

// Every domain's actions in one place.
export const actions = createActions((world) => ({
  ...cameraActions(world), // <--
  ...playerActions(world),
}));
```

In `world.ts`, spawn it where the Canvas camera used to be, looking at the capsule's middle.

```ts
const { spawnPlayer, spawnCamera } = actions(world);
spawnPlayer({ position: [0, 1, 0] });
spawnCamera({ position: [4, 2, 6], target: [0, 1, 0] }); // <--
```

## 3. Render the camera

Create `camera/renderer.tsx`. It follows the same shape as the player renderer, but the view is a camera instead of a mesh.

```tsx
import { PerspectiveCamera } from '@react-three/drei/webgpu';
import type { Entity } from 'koota';
import { useQuery, useTrait } from 'koota/react';
import { Position, Rotation } from '../transform/traits';
import { Camera } from './traits';

export function CameraRenderer() {
  const cameras = useQuery(Camera, Position, Rotation);
  return cameras.map((entity) => <CameraView key={entity.id()} entity={entity} />);
}

function CameraView({ entity }: { entity: Entity }) {
  const position = useTrait(entity, Position);
  const rotation = useTrait(entity, Rotation);

  return (
    <PerspectiveCamera
      makeDefault
      fov={70}
      position={position?.toArray()}
      quaternion={rotation?.toArray()}
    />
  );
}
```

`makeDefault` tells Fiber to draw the scene through this camera. The field of view is wider than the Canvas default, closer to Minecraft's. `toArray` copies the vectors into plain arrays, since props should be values rather than objects the simulation keeps mutating.

In `app.tsx`, import the renderer, drop the `camera` prop from the Canvas, and add the renderer to the scene.

```tsx
import { CameraRenderer } from './camera/renderer'; // <--
import { Frameloop } from './frameloop';
```

```tsx
<Canvas shadows>
```

```tsx
<PlayerRenderer />
<Ground />
<CameraRenderer /> {/* <-- */}
```

## Try it

Open [your practice game](http://localhost:5173/). The capsule is now centered because the camera looks at its middle. Change the camera's `position` in `world.ts` to move it, then change `target` to see it turn.

Restore the values above. Next we use pointer input to move this camera.

[Run the completed step](http://localhost:5173/?step=4) · [Next, orbit →](../05-orbit/README.md)
