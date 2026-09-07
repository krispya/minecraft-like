# A Minecraft-like game, step by step

Build a small Minecraft-like game: walk, jump, place and break blocks, then add wandering pigs. [React Three Fiber](https://docs.pmnd.rs/react-three-fiber), [Three.js](https://threejs.org/) and [drei](https://drei.docs.pmnd.rs/) draw the scene with WebGPU. [Koota](https://github.com/pmndrs/koota) holds the game data.

Start with [lesson 1](src/steps/01-stage/README.md) and edit the [src/game](src/game/) folder throughout all twelve lessons. Each guide shows every edit needed for the next step. The numbered folders in [src/steps](src/steps/) contain the completed examples.

Run `pnpm install`, then `pnpm dev`, and open [your practice game](http://localhost:5173/). It starts with an empty Canvas. The numbered links at the top open the completed examples. Return to **game** to see your edits.

Paths in each lesson are relative to `src/game`. Create folders as needed. `// <--` marks an edit, and `...` marks existing code to keep. After trying a different speed, size or spawn position, restore the lesson's values before continuing.

## How the game fits together

**Input** records keys and clicks. The **simulation** applies rules, like movement and gravity. The **view** draws the result. Keeping the rules outside React lets us run the game without a screen.

Koota stores the simulation's data. Each lesson introduces these terms when it needs them:

| Word       | Meaning                                                                  |
| ---------- | ------------------------------------------------------------------------ |
| **World**  | Holds every entity, plus a few shared traits like the clock              |
| **Entity** | An ID that traits attach to                                              |
| **Trait**  | Data attached to an entity, like `Position`. Other engines say component |
| **Query**  | Finds every entity that has a set of traits                              |
| **System** | A function that queries entities and updates their traits, once per tick |
| **Action** | A function bound to a world that changes it, like spawning a player      |

The **frame loop** runs the systems in order each tick. They read input, move characters, resolve collisions and update the camera. The view then draws the result.

## Lessons

1. [Stage](src/steps/01-stage/README.md) draws a ground and a sky the usual React Three Fiber way.
2. [Frame loop](src/steps/02-frameloop/README.md) creates the world, a `Time` trait, the first system and a clock on screen.
3. [Player](src/steps/03-player/README.md) spawns a player entity and draws it from a query.
4. [Camera](src/steps/04-camera/README.md) makes the camera an entity too.
5. [Orbit](src/steps/05-orbit/README.md) reads the pointer and wheel and orbits the camera.
6. [Controller](src/steps/06-controller/README.md) reads the keyboard, moves the player and has the camera follow.
7. [Jump](src/steps/07-jump/README.md) adds gravity, a jump and a floor to land on.
8. [Model](src/steps/08-model/README.md) swaps the capsule for the Minecraft character and turns it to face where it walks.
9. [Animation](src/steps/09-animation/README.md) names what the character is doing and plays the matching clip.
10. [Place](src/steps/10-place/README.md) places blocks with a right click and makes them solid.
11. [Mine](src/steps/11-mine/README.md) puts an axe in hand and breaks blocks with a left click.
12. [Pig](src/steps/12-pig/README.md) adds pigs that wander on the same controller as the player.

## Where we end up

Each folder in `src/game` groups one part of the game. `traits.ts` defines its data, `actions.ts` provides operations such as spawning, `systems.ts` updates it each tick, and `renderer.tsx` draws it. React stays in the renderers, input hooks, app and frame loop.

```
src/game
├── app.tsx           the Canvas, lights and every renderer
├── world.ts          creates the world and spawns the starting entities
├── frameloop.tsx     runs every system in order, once per tick
├── actions.ts        every domain's actions in one place
├── time              Time
├── input             Keys, Pointer, Wheel and the hooks that fill them
├── transform         Position, Rotation
├── physics           Velocity, colliders, IsGrounded
├── camera            Camera, Follows, OrbitController
├── character         CharacterController, Input and the states
├── player            Player, its spawn, its input and its model
├── ground            Ground
├── block             Block, BlockDamage, placing
├── item              ToolSwing, hitting
└── pig               Pig, Wander
```

## Credits

The [Minecraft character](https://sketchfab.com/3d-models/minecraft-idle-and-walking-animation-a3f0270cc1ef42d59be153204d03b0f8), [diamond axe](https://sketchfab.com/3d-models/minecraft-diamond-axe-0d62f4d3676545c88ec8523213c055dd) and [saddled pig](https://sketchfab.com/3d-models/minecraft-saddled-pig-22a686ae544e41bfa640bc757e61d7a9) are from Sketchfab under CC BY 4.0.
