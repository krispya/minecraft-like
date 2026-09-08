# minecraft-like

This project was generated with create-krispya

## Project Architecture

This project uses [Vite](https://vitejs.dev/) as the bundler for fast development and optimized production builds.

- `src/app.tsx` defines the main application component containing your 3D content
- `src/main.tsx` renders the React app into the DOM
- `src/frameloop.tsx` runs every system in tick order, and `src/actions.ts` gathers every domain's actions
- Static assets can be placed in the `public` folder

### Domains

`src/transform.ts` holds the shared `Position`, `Rotation`, and `Scale` traits. Small shared modules live at the root so these basic building blocks are easy to find.

Domains have their own folders: `physics`, `input`, `time`, `character`, `riding`, `camera`, `block`, `terrain`, `item`, and `view`. Each folder holds the files its concept needs:

- `traits.ts` is the data, the domain's public vocabulary
- `actions.ts` is how the data is changed, the domain's public API
- `systems.ts` advances the data every tick, and subscribes to the events it reacts to
- `renderer.tsx` reflects the data into React Three Fiber
- other files provide helpers, like `block/grid.ts` or `terrain/noise.ts`

Domains may import each other's traits and actions. Systems and renderers are wired together by the app. The simulation stays headless: its traits, actions, and systems do not depend on React or mounted objects.

`controllers/` groups the headless behavior modules `orbitController.ts`, `firstPersonController.ts`, and `characterController.ts`. Each module owns its controller traits and the systems that drive them. `camera/` owns shared follow and perspective traits, camera spawning, and perspective switching. `character/` groups shared character behavior and the player and pig implementations. `stateMachine.ts` contains movement state traits, transitions, and state updates. `wander.ts` contains wandering traits and the input system. `player/` and `pig/` each retain their spawning, traits, and rendering code, with player input in `player/systems.ts`.

`terrain/` groups the permanent ground plane and generated block terrain. `ground/` contains the plane's trait, spawn action, and renderer. Terrain generation stays in the parent directory, and generated blocks use the shared block renderer.

### View sync

The simulation owns transforms. `view/` copies them into mounted Three objects once per frame, so direct mutations are visible without React subscriptions.

1. A renderer uses `ref={captureRef(entity)}` to store its root object in the view-only `Ref` trait.
2. `Frameloop` runs `syncTransforms(world)` after all simulation updates. It copies each available `Position`, `Rotation`, and `Scale` into that object.
3. React's ref cleanup removes the captured object on unmount. Cleanup is safe when an entity has already been destroyed or another object has replaced the ref.

Capture the outer group to preserve model offsets and animation inside it. Debug colliders use `captureRef(entity, ColliderDebugRef)` so they follow position while keeping their world-aligned shape. Instanced blocks keep their batch renderer, and held-item animations keep their local refs.

Keep `Ref` out of spawning and simulation code. An entity can run without a mounted view.

## Libraries

The following libraries are used - checkout the linked docs to learn more

- [React](https://react.dev/) - A JavaScript library for building user interfaces
- [Three.js](https://threejs.org/) - JavaScript 3D library
- [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) - lets you create Three.js scenes using React components
- [@react-three/drei](https://drei.docs.pmnd.rs/) - Useful helpers for @react-three/fiber
- [koota](https://github.com/pmndrs/koota) - ECS-based state management library optimized for real-time apps, games, and XR experiences
- [math](https://github.com/pmndrs/math) - Random sampling, seeded generators, and terrain interpolation and fractal helpers

## Tools

- [Oxlint](https://oxc.rs/docs/guide/usage/linter) - A fast linter for JavaScript and TypeScript
- [Prettier](https://prettier.io/) - Opinionated code formatter

## Development Commands

- `pnpm install` to install the dependencies
- `pnpm run dev` to run the development server and preview the app with live updates
- `pnpm run build` to build the app into the `dist` folder
- `node --test tests/view-sync.test.mjs` to run the view sync tests
