# 2. The frame loop

Movement needs to know how much time has passed. Create a Koota world to hold the game data, then add a clock and a frame loop to update it.

Continue in `src/game` from [lesson 1](../01-stage/README.md). Koota is already installed.

## 1. Model time

The first piece of data is time itself. Create `time/traits.ts`:

```ts
import { trait } from 'koota'

// Seconds since the last tick, and the clock reading of this tick in milliseconds.
export const Time = trait({ delta: 0, current: 0 })
```

A **trait** is a definition with default values. This one will live on the world rather than on an entity, since there is only one clock.

## 2. Create the world

Create `world.ts`. The **world** holds every entity and the shared traits.

```ts
import { createWorld } from 'koota'
import { Time } from './time/traits'

export const world = createWorld(Time)

if (import.meta.hot) import.meta.hot.dispose(() => world.destroy())
```

The last line cleans up during hot reload, so an edit does not leave an old world ticking.

## 3. Advance time each tick

A **system** is a plain function that takes the world and updates it. Create `time/systems.ts`:

```ts
import type { World } from 'koota'
import { Time } from './traits'

export function updateTime(world: World) {
  const time = world.get(Time)!

  // The first tick has nothing to measure against.
  if (time.current === 0) time.current = performance.now()

  const now = performance.now()
  const delta = now - time.current

  // Cap the step so a stalled tab does not launch everything on the next frame.
  time.delta = Math.min(delta / 1000, 1 / 30)
  time.current = now

  world.set(Time, time)
}
```

`delta` is the time since the previous tick, in seconds, capped at `1 / 30`. Multiplying a speed by `delta` gives the distance to move this tick. This keeps steady movement consistent at 60 Hz and 120 Hz. During a stall, the cap lets the simulation fall behind real time instead of taking one large step.

`current` is the clock reading from `performance.now()`, not accumulated game time. `world.set` writes the trait back and notifies subscribers.

## 4. Write the frame loop

Create `frameloop.tsx`. The loop is a component so it can use Fiber's `useFrame`, but it renders nothing.

```tsx
import { useFrame } from '@react-three/fiber/webgpu'
import { useWorld } from 'koota/react'
import { updateTime } from './time/systems'

// The tick. Every system runs here, in one order, before the views read the world.
export function Frameloop() {
  const world = useWorld()

  useFrame(
    () => {
      updateTime(world)
    },
    { before: 'update' }
  )

  return null
}
```

`before: 'update'` runs the simulation before the view's frame callbacks. Each lesson adds systems to this callback so their order stays in one place.

## 5. Provide the world and show the clock

In `app.tsx`, import the pieces.

```tsx
import { Sky, useTexture } from '@react-three/drei/webgpu'
import { Canvas } from '@react-three/fiber/webgpu'
import { useTrait, useWorld, WorldProvider } from 'koota/react' // <--
import { RepeatWrapping } from 'three/webgpu'
import { Frameloop } from './frameloop' // <--
import { Time } from './time/traits' // <--
import { world } from './world' // <--
```

Wrap everything in `WorldProvider` so the hooks can find the world, and add the loop and a clock beside the Canvas. Comments with `...` stand for existing code to keep.

```tsx
export function App() {
  return (
    <WorldProvider world={world}>
      <Canvas shadows camera={{ position: [4, 3, 6], fov: 45 }}>
        {/* ... */}
      </Canvas>
      <Frameloop /> {/* <-- */}
      <Clock /> {/* <-- */}
    </WorldProvider>
  )
}
```

The Fiber version installed in this project supports `useFrame` outside Canvas. That lets `Frameloop` share the scheduler without being part of the scene.

Add `Clock` below `App`. It is our first view: it reads a trait and draws it.

```tsx
function Clock() {
  const world = useWorld()
  const time = useTrait(world, Time)

  if (!time) return null

  return (
    <div style={{ position: 'absolute', top: 8, left: 8, color: 'white', fontFamily: 'monospace' }}>
      <div>Time: {(time.current / 1000).toFixed(2)} s</div>
      <div>Delta: {(time.delta * 1000).toFixed(2)} ms</div>
    </div>
  )
}
```

`useTrait` subscribes, so the clock re-renders every time `updateTime` sets `Time`.

## Try it

Open [your practice game](http://localhost:5173/). The clock counts up in the corner. At a steady 60 FPS, Delta is about 16.67 ms. At 120 FPS, it is about 8.33 ms. It never exceeds 33.33 ms, even after a stalled frame.

The scene is still static. Next we give the player data that the simulation can change.

[Run the completed step](http://localhost:5173/?step=2) · [Next, the player →](../03-player/README.md)
