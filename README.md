# minecraft-like

This project was generated with create-krispya

## Project Architecture

This project uses [Vite](https://vitejs.dev/) as the bundler for fast development and optimized production builds.

- `src/app.tsx` defines the main application component containing your 3D content
- `src/main.tsx` renders the React app into the DOM
- Modify the content inside the `<Canvas>` component to change what is visible on screen
- `tests/` contains your test files
- Static assets can be placed in the `public` folder

## Libraries

The following libraries are used - checkout the linked docs to learn more

- [React](https://react.dev/) - A JavaScript library for building user interfaces
- [Three.js](https://threejs.org/) - JavaScript 3D library
- [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) - lets you create Three.js scenes using React components
- [@react-three/drei](https://drei.docs.pmnd.rs/) - Useful helpers for @react-three/fiber
- [koota](https://github.com/pmndrs/koota) - ECS-based state management library optimized for real-time apps, games, and XR experiences

## Tools

- [Oxlint](https://oxc.rs/docs/guide/usage/linter) - A fast linter for JavaScript and TypeScript
- [Prettier](https://prettier.io/) - Opinionated code formatter

## Development Commands

- `pnpm install` to install the dependencies
- `pnpm run dev` to run the development server and preview the app with live updates
- `pnpm run build` to build the app into the `dist` folder
- `pnpm run test` to run the tests
