# 6. Move the player

Move the player with WASD or the arrow keys and have the camera follow. Convert keys into a movement direction, then let a shared character controller turn that direction into motion.

Continue in `src/game` from [lesson 5](../05-orbit/README.md).

## 1. Read the keyboard

In `input/traits.ts`, add `Keys` before `Pointer`.

```ts
// Every key currently held, by KeyboardEvent.key in lower case.
export const Keys = trait(() => new Set<string>())
```

In `input/hooks.ts`, import it and add `useKeyboard` above `usePointer`. A key stays in the set from keydown until keyup, so we do not clear it each frame.

```ts
import { Keys, Pointer, Wheel } from './traits' // <--

export function useKeyboard(world: World) {
  useEffect(() => {
    const keys = world.get(Keys)!

    const setKey = (key: string, pressed: boolean) => {
      if (pressed) keys.add(key)
      else keys.delete(key)

      world.set(Keys, keys)
    }

    const handleKeyDown = (event: KeyboardEvent) => setKey(event.key.toLowerCase(), true)
    const handleKeyUp = (event: KeyboardEvent) => setKey(event.key.toLowerCase(), false)

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [world])
}
```

## 2. Model a character

The player is not the only thing that will walk, so the controller is its own domain. Create `character/traits.ts`:

```ts
import { trait } from 'koota'

// How a character moves. Speeds are units per second, and the rates are how fast the velocity
// changes toward the input while moving and toward zero while not.
export const CharacterController = trait({
  maxSpeed: 5,
  acceleration: 50,
  friction: 70,
})
// Movement input in world space. x points along +x and y along -z, each -1 to 1.
export const Input = trait({ x: 0, y: 0 })
```

`Keys` records physical keys. `Input` records the direction a character wants to move: `x` along world `+x`, and `y` along world `-z`. The player system will convert camera-relative keys into this direction. Later, a pig will supply its own direction.

Create `physics/traits.ts` with the first physics trait:

```ts
import { trait } from 'koota'
import { Vector3 } from 'three'

export const Velocity = trait(() => new Vector3())
```

## 3. Turn input into motion

Create `character/systems.ts`. Acceleration moves velocity toward the requested speed. Friction moves it toward zero when there is no input.

```ts
import type { World } from 'koota'
import { Velocity } from '../physics/traits'
import { Time } from '../time/traits'
import { Position } from '../transform/traits'
import { CharacterController, Input } from './traits'

export function updateCharacterController(world: World) {
  const { delta } = world.get(Time)!

  world
    .query(CharacterController, Input, Position, Velocity)
    .updateEach(([controller, input, position, velocity]) => {
      const hasInput = input.x !== 0 || input.y !== 0
      // Forward is -z in Three, so a positive y input moves toward negative z.
      const targetX = input.x * controller.maxSpeed
      const targetZ = -input.y * controller.maxSpeed
      const changeX = targetX - velocity.x
      const changeZ = targetZ - velocity.z
      const changeLength = Math.hypot(changeX, changeZ)
      const rate = hasInput ? controller.acceleration : controller.friction
      const maxChange = rate * delta

      // Move the velocity toward the target, but only as far as the rate allows this tick.
      if (changeLength <= maxChange) {
        velocity.x = targetX
        velocity.z = targetZ
      } else if (changeLength > 0) {
        const scale = maxChange / changeLength
        velocity.x += changeX * scale
        velocity.z += changeZ * scale
      }

      position.x += velocity.x * delta
      position.z += velocity.z * delta
    })
}
```

`velocity * delta` is the distance to move this tick, the same math as any physics step.

## 4. Follow the player

The camera should orbit the player rather than a fixed point. A **relation** is a trait that points at another entity. In `camera/traits.ts`, add `Follows` after `Camera`.

```ts
import { relation, trait } from 'koota' // <--
import { Spherical, Vector3 } from 'three'

export const Camera = trait()
// Camera to the entity it keeps in view. Exclusive, so a camera follows one thing at a time.
export const Follows = relation({ exclusive: true }) // <--
```

In `camera/systems.ts`, import it and add `updateFollowTarget` above `updateOrbitController`. It copies the followed entity's position into the orbit target each tick.

```ts
import { Follows, OrbitController } from './traits' // <--
```

```ts
// Keeps the orbit centered on whatever the camera follows.
export function updateFollowTarget(world: World) {
  world.query(Follows('*'), OrbitController).updateEach(([controller], entity) => {
    const targetPosition = entity.targetFor(Follows)?.get(Position)

    if (targetPosition) controller.target.copy(targetPosition)
  })
}
```

`Follows('*')` matches a camera following anything. `targetFor` returns what it follows.

## 5. Read keys relative to the camera

Create `player/systems.ts`. It maps keys onto `Input` in the camera's frame, so pressing up always walks away from the camera.

```ts
import type { World } from 'koota'
import { Vector3 } from 'three'
import { Camera, Follows } from '../camera/traits'
import { Input } from '../character/traits'
import { Keys } from '../input/traits'
import { Rotation } from '../transform/traits'
import { Player } from './traits'

const UP = new Vector3(0, 1, 0)
const cameraForward = new Vector3()
const cameraRight = new Vector3()

// Reads the held keys into the player's Input, relative to the camera that follows them.
export function updatePlayerInput(world: World) {
  const keys = world.get(Keys)!

  world.query(Player, Input).updateEach(([input], entity) => {
    const right = keys.has('arrowright') || keys.has('d')
    const left = keys.has('arrowleft') || keys.has('a')
    const up = keys.has('arrowup') || keys.has('w')
    const down = keys.has('arrowdown') || keys.has('s')

    // Normalize so a diagonal is no faster than a straight line.
    const x = Number(right) - Number(left)
    const y = Number(up) - Number(down)
    const length = Math.hypot(x, y) || 1

    const localX = x / length
    const localY = y / length
    const cameraRotation = world.queryFirst(Camera, Follows(entity), Rotation)?.get(Rotation)
    if (!cameraRotation) return

    // Forward is wherever the camera looks, flattened onto the ground.
    cameraForward.set(0, 0, -1).applyQuaternion(cameraRotation)
    cameraForward.y = 0
    cameraForward.normalize()
    cameraRight.crossVectors(cameraForward, UP)

    input.x = cameraRight.x * localX + cameraForward.x * localY
    input.y = -(cameraRight.z * localX + cameraForward.z * localY)
  })
}
```

`Follows(entity)` finds this player's camera. We flatten its forward direction onto the ground, then combine forward and right according to the keys. Normalizing the key direction keeps diagonal movement from being faster.

## 6. Wire it up

In `player/actions.ts`, give the player its controller, input and velocity.

```ts
import { createActions } from 'koota'
import { Vector3 } from 'three'
import { CharacterController, Input } from '../character/traits' // <--
import { Velocity } from '../physics/traits' // <--
import { Position } from '../transform/traits'
import { Player } from './traits'

export const playerActions = createActions((world) => ({
  spawnPlayer: ({ position = [0, 0, 0] } = {}) => {
    return world.spawn(
      Player,
      CharacterController, // <--
      Input, // <--
      Position(new Vector3(...position)),
      Velocity // <--
    )
  },
}))
```

In `world.ts`, add `Keys` to the world and have the camera follow the player. The camera no longer needs a target of its own.

```ts
import { createWorld } from 'koota'
import { actions } from './actions'
import { Follows } from './camera/traits' // <--
import { Keys, Pointer, Wheel } from './input/traits' // <--
import { Time } from './time/traits'

export const world = createWorld(Time, Keys, Pointer, Wheel) // <--

const { spawnPlayer, spawnCamera } = actions(world)
const player = spawnPlayer({ position: [0, 1, 0] }) // <--
const camera = spawnCamera() // <--
camera.add(Follows(player)) // <--

if (import.meta.hot) import.meta.hot.dispose(() => world.destroy())
```

In `frameloop.tsx`, attach the keyboard and add the systems. Input comes first, then the controller moves the player, then the camera catches up.

```tsx
import { applyOrbit, updateFollowTarget, updateOrbitController } from './camera/systems' // <--
import { updateCharacterController } from './character/systems' // <--
import { useKeyboard, usePointer, useWheel } from './input/hooks' // <--
import { resetInputDelta } from './input/systems'
import { updatePlayerInput } from './player/systems' // <--
```

```tsx
const world = useWorld()
useKeyboard(world) // <--
usePointer(world)
useWheel(world)
```

```tsx
updateTime(world)

updatePlayerInput(world) // <--
updateCharacterController(world) // <--

updateFollowTarget(world) // <--
updateOrbitController(world)
applyOrbit(world)

resetInputDelta(world)
```

## Try it

Open [your practice game](http://localhost:5173/). Walk with WASD or the arrows. The camera follows. Orbit to another side, then press W or up: the capsule moves away from the camera. Diagonal movement should have the same top speed as straight movement.

Lower `acceleration` in `character/traits.ts` to make starting slower. Lower `friction` to make stopping slower. The capsule stays at the same height until we add gravity next.

[Run the completed step](http://localhost:5173/?step=6) · [Next, jump →](../07-jump/README.md)
