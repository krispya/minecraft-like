# 3. The player entity

The simulation needs to own the player's position before it can move it. Spawn a player entity with a `Position` trait, then draw it with a renderer.

Continue in `src/game` from [lesson 2](../02-frameloop/README.md).

## 1. Define the traits

Create `transform/traits.ts`. Players, cameras and blocks will all need a position.

```ts
import { trait } from 'koota'
import { Vector3 } from 'three'

export const Position = trait(() => new Vector3())
```

A trait can hold an object. The function makes a fresh `Vector3` for each entity so they never share one. The simulation imports math from `three`, while views import from `three/webgpu`.

Create `player/traits.ts`:

```ts
import { trait } from 'koota'

export const Player = trait()
```

A trait with no data is a **tag**. It marks which entity is the player.

## 2. Spawn through an action

Create `player/actions.ts`. An **action** is a function bound to a world that changes it.

```ts
import { createActions } from 'koota'
import { Vector3 } from 'three'
import { Position } from '../transform/traits'
import { Player } from './traits'

export const playerActions = createActions((world) => ({
  spawnPlayer: ({ position = [0, 0, 0] } = {}) => {
    return world.spawn(Player, Position(new Vector3(...position)))
  },
}))
```

`world.spawn` creates an **entity** with the given traits and returns it. `Position(...)` fills in a starting value instead of the default.

Each folder will have its own actions. Create `actions.ts` at the top of `src/game` to gather them in one place.

```ts
import { createActions } from 'koota'
import { playerActions } from './player/actions'

// Every domain's actions in one place.
export const actions = createActions((world) => ({
  ...playerActions(world),
}))
```

In `world.ts`, spawn the player right after creating the world.

```ts
import { createWorld } from 'koota'
import { actions } from './actions' // <--
import { Time } from './time/traits'

export const world = createWorld(Time)

const { spawnPlayer } = actions(world) // <--
spawnPlayer({ position: [0, 1, 0] }) // <--

if (import.meta.hot) import.meta.hot.dispose(() => world.destroy())
```

## 3. Render from a query

Create `player/renderer.tsx`. A **query** finds every entity that has a set of traits.

```tsx
import type { Entity } from 'koota'
import { useQuery, useTrait } from 'koota/react'
import { Position } from '../transform/traits'
import { Player } from './traits'

export function PlayerRenderer() {
  const players = useQuery(Player, Position)
  return players.map((entity) => <PlayerView key={entity.id()} entity={entity} />)
}

// A stand-in for the player, two units tall like a Minecraft character.
function PlayerView({ entity }: { entity: Entity }) {
  const position = useTrait(entity, Position)

  return (
    <mesh castShadow position={position?.toArray()}>
      <capsuleGeometry args={[0.3, 1.4, 4, 16]} />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  )
}
```

`useQuery` subscribes to which entities match, so a player that spawns or dies appears or disappears. Each `PlayerView` subscribes to its own `Position` with `useTrait`. This is the pattern for every renderer from here on: a query for the entities, a view per entity.

In `app.tsx`, import the renderer and use it in place of `Player`. Delete the old `Player` component.

```tsx
import { Frameloop } from './frameloop'
import { PlayerRenderer } from './player/renderer' // <--
import { Time } from './time/traits'
```

```tsx
<PlayerRenderer />
<Ground />
```

## Try it

Open [your practice game](http://localhost:5173/). It should look the same as before. Change the spawn position in `world.ts` to `[2, 1, 0]` and reload: the capsule moves sideways. Add a second `spawnPlayer` call at `[-2, 1, 0]`: the same renderer draws both.

Restore one player at `[0, 1, 0]` before continuing. Next we move the camera into the world too.

[Run the completed step](http://localhost:5173/?step=3) · [Next, the camera →](../04-camera/README.md)
