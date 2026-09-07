# 5. Orbit the camera

Let the player inspect the scene by dragging to orbit and scrolling to zoom. Events record pointer input in traits. Systems turn that input into camera movement.

Continue in `src/game` from [lesson 4](../04-camera/README.md).

## 1. Model the input

Create `input/traits.ts`. Input is data like anything else.

```ts
import { trait } from 'koota';
import { Vector2 } from 'three';

export const Pointer = trait({
  // Normalized device coordinates, -1 to 1 across the window.
  position: () => new Vector2(),
  // Movement accumulated since the last tick.
  delta: () => new Vector2(),
  // Held buttons bitmask, like MouseEvent.buttons.
  buttons: 0,
});
// Notches scrolled since the last tick, positive when scrolling down.
export const Wheel = trait({ delta: 0 });
```

Both live on the world. `delta` is the important part: several events can arrive between two ticks, so they add up, and a system reads the total.

## 2. Fill it from events

Create `input/hooks.ts`. These hooks listen to window events and write input traits. They record input without deciding how the camera should move.

```ts
import type { World } from 'koota';
import { useEffect } from 'react';
import { Pointer, Wheel } from './traits';

export function usePointer(world: World) {
  useEffect(() => {
    const toNdcX = (event: PointerEvent) => (event.clientX / window.innerWidth) * 2 - 1;
    const toNdcY = (event: PointerEvent) => -(event.clientY / window.innerHeight) * 2 + 1;

    const handlePointerButtons = (event: PointerEvent) => {
      const pointer = world.get(Pointer)!;
      // Prevent a jump on the next move.
      pointer.position.set(toNdcX(event), toNdcY(event));
      pointer.buttons = event.buttons;

      world.set(Pointer, pointer);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const pointer = world.get(Pointer)!;
      const x = toNdcX(event);
      const y = toNdcY(event);

      // Several moves can land between two ticks, so add them up.
      pointer.delta.x += x - pointer.position.x;
      pointer.delta.y += y - pointer.position.y;
      pointer.position.set(x, y);

      world.set(Pointer, pointer);
    };

    window.addEventListener('pointerdown', handlePointerButtons);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerButtons);
    window.addEventListener('pointercancel', handlePointerButtons);

    return () => {
      window.removeEventListener('pointerdown', handlePointerButtons);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerButtons);
      window.removeEventListener('pointercancel', handlePointerButtons);
    };
  }, [world]);
}

export function useWheel(world: World) {
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      // Keep the page from scrolling.
      event.preventDefault();

      const wheel = world.get(Wheel)!;
      // About one notch per hundred pixels.
      wheel.delta += event.deltaY / 100;

      world.set(Wheel, wheel);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [world]);
}
```

Pointer coordinates run from `-1` to `1` across the window. Dragging across half the window gives the same delta at any screen size.

Once every system has read the deltas, they need to go back to zero. Create `input/systems.ts`:

```ts
import type { World } from 'koota';
import { Pointer, Wheel } from './traits';

// Clears the deltas once every system has read them.
export function resetInputDelta(world: World) {
  const pointer = world.get(Pointer)!;
  pointer.delta.set(0, 0);
  world.set(Pointer, pointer);

  const wheel = world.get(Wheel)!;
  wheel.delta = 0;
  world.set(Wheel, wheel);
}
```

## 3. Model the orbit

An orbit needs a target and three values: distance, angle down from vertical, and angle around the target. Three stores those values in `Spherical`. In `camera/traits.ts`, add `OrbitController`.

```ts
import { trait } from 'koota';
import { Spherical, Vector3 } from 'three'; // <--

export const Camera = trait();

export const OrbitController = trait({
  // Where the camera sits relative to the target: how far away, how far down from straight up,
  // and how far around.
  spherical: () => new Spherical(4, Math.PI / 2.4, 0),
  target: () => new Vector3(),
  minDistance: 2,
  maxDistance: 8,
});
```

`OrbitController` holds the orbit settings. The systems below apply them to any entity with the required traits.

In `camera/actions.ts`, the controller now decides where the camera sits, so `spawnCamera` no longer builds a rotation. Replace it:

```ts
import { createActions } from 'koota';
import { Vector3 } from 'three';
import { Position, Rotation } from '../transform/traits';
import { Camera, OrbitController } from './traits';

export const cameraActions = createActions((world) => ({
  spawnCamera: ({ target = [0, 0, 0] } = {}) => {
    // The controller places the camera every tick, so it only needs to know what to orbit.
    return world.spawn(
      Camera,
      Position,
      Rotation,
      OrbitController({ target: new Vector3(...target) })
    );
  },
}));
```

## 4. Move the orbit

Create `camera/systems.ts` with two systems. One turns input into a new orbit, the other turns the orbit into a position and rotation.

```ts
import type { World } from 'koota';
import { MathUtils, Matrix4, Vector3 } from 'three';
import { Pointer, Wheel } from '../input/traits';
import { Position, Rotation } from '../transform/traits';
import { OrbitController } from './traits';

const UP = new Vector3(0, 1, 0);
const matrix = new Matrix4();

// Moves the orbit by this tick's input.
export function updateOrbitController(world: World) {
  const pointer = world.get(Pointer)!;
  const wheel = world.get(Wheel)!;

  world.query(OrbitController).updateEach(([controller]) => {
    const { spherical, minDistance, maxDistance } = controller;

    // Dragging across the whole window turns the camera all the way around.
    if (pointer.buttons !== 0) {
      spherical.theta -= pointer.delta.x * Math.PI;
      spherical.phi += pointer.delta.y * Math.PI;
    }

    // Each notch zooms by a tenth, so it feels the same near and far.
    spherical.radius *= 1.1 ** wheel.delta;

    spherical.radius = MathUtils.clamp(spherical.radius, minDistance, maxDistance);
    // Stay above the ground and off the pole straight overhead.
    spherical.phi = MathUtils.clamp(spherical.phi, 0.1, Math.PI / 2);
  });
}

// Places the camera on its orbit, facing the target.
export function applyOrbit(world: World) {
  world.query(OrbitController, Position, Rotation).updateEach(([controller, position, rotation]) => {
    const { spherical, target } = controller;

    position.setFromSpherical(spherical).add(target);
    matrix.lookAt(position, target, UP);
    rotation.setFromRotationMatrix(matrix);
  });
}
```

`updateEach` provides the matching traits, writes changes back and detects changes for subscribers such as `useTrait`. The look-at math from lesson 4 now runs every tick.

## 5. Wire it up

In `world.ts`, give the world the input traits and spawn the camera with only a target.

```ts
import { createWorld } from 'koota';
import { actions } from './actions';
import { Pointer, Wheel } from './input/traits'; // <--
import { Time } from './time/traits';

export const world = createWorld(Time, Pointer, Wheel); // <--

const { spawnPlayer, spawnCamera } = actions(world);
spawnPlayer({ position: [0, 1, 0] });
spawnCamera({ target: [0, 1, 0] }); // <--

if (import.meta.hot) import.meta.hot.dispose(() => world.destroy());
```

In `frameloop.tsx`, attach the hooks and add the systems. The reset runs last so nothing misses this tick's input.

```tsx
import { useFrame } from '@react-three/fiber/webgpu';
import { useWorld } from 'koota/react';
import { applyOrbit, updateOrbitController } from './camera/systems'; // <--
import { usePointer, useWheel } from './input/hooks'; // <--
import { resetInputDelta } from './input/systems'; // <--
import { updateTime } from './time/systems';

// The tick. Every system runs here, in one order, before the views read the world.
export function Frameloop() {
  const world = useWorld();
  usePointer(world); // <--
  useWheel(world); // <--

  useFrame(
    () => {
      updateTime(world);

      updateOrbitController(world); // <--
      applyOrbit(world); // <--

      resetInputDelta(world); // <--
    },
    { before: 'update' }
  );

  return null;
}
```

## Try it

Open [your practice game](http://localhost:5173/). Hold a mouse button and drag to circle the capsule. Scroll to zoom, then release the button: moving the pointer alone should leave the camera still.

Drag upward until the camera reaches the target's height. It stops there instead of orbiting underneath. Increase `maxDistance` in `camera/traits.ts` and reload to zoom out farther. Next we make the player move.

[Run the completed step](http://localhost:5173/?step=5) · [Next, the controller →](../06-controller/README.md)
