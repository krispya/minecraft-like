# 1. Set the stage

Start with a visible scene so we have somewhere to build the game. Add a sky, lighting and grass.

Work directly in the [src/game](../../game/) folder. Its `app.tsx` is an empty Canvas with a note over it. Make the following edits there and keep using this folder for every lesson. The files beside this guide contain the completed version.

## 1. Sky and sun

Replace the contents of `app.tsx` with a Canvas that has a sky, some fill light and a sun.

```tsx
import { Sky, useTexture } from '@react-three/drei/webgpu';
import { Canvas } from '@react-three/fiber/webgpu';
import { RepeatWrapping } from 'three/webgpu';

export function App() {
  return (
    <Canvas shadows camera={{ position: [4, 1.5, 6], fov: 45 }}>
      <Sky sunPosition={[100, 20, 100]} />
      <ambientLight intensity={0.3 * Math.PI} />
      <Sun />
    </Canvas>
  );
}
```

Everything comes from the `webgpu` entries of Fiber and drei, which draw with WebGPU and fall back to WebGL where the browser lacks it. `shadows` enables shadows. The camera starts behind the origin at about eye height, looking toward it. Keeping it low keeps the horizon in view. `ambientLight` lights every surface, while `Sun` gives the light a direction.

Add `Sun` below `App`.

```tsx
// One directional light casts shadows inside a box around the origin.
function Sun() {
  return (
    <directionalLight
      castShadow
      intensity={0.8 * Math.PI}
      position={[100, 100, 100]}
      shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-60}
      shadow-camera-right={60}
      shadow-camera-top={60}
      shadow-camera-bottom={-60}
      shadow-camera-near={10}
      shadow-camera-far={400}
      shadow-bias={-0.0005}
    />
  );
}
```

The light's shadow camera covers a box 120 units across. Only objects inside that box cast shadows.

Run `pnpm dev` and open [your practice game](http://localhost:5173/). You should see the sky. The light needs a surface before we can see what it lights.

## 2. Ground

The ground is a large plane turned flat. Add it below `Sun`.

```tsx
function Ground() {
  const texture = useTexture('/grass.jpg');
  texture.wrapS = texture.wrapT = RepeatWrapping;

  return (
    <mesh receiveShadow rotation-x={-Math.PI / 2}>
      <planeGeometry args={[1000, 1000]} />
      <meshStandardMaterial map={texture} map-repeat={[240, 240]} color="green" />
    </mesh>
  );
}
```

`useTexture` loads an image from `public`. Repeating it 240 times across the plane keeps the grass small. A plane faces `+z`, so a quarter turn around `x` lays it flat.

Add it inside the Canvas, after `<Sun />`.

```tsx
<Sun />

<Ground /> {/* <-- */}
```

## Try it

Run `pnpm dev` and open [your practice game](http://localhost:5173/). You should see green grass under a blue sky. Change `sunPosition` to move the sun across it.

Nothing here changes from one frame to the next. Next we start a simulation that will own and update the game data.

[Run the completed step](http://localhost:5173/?step=1) · [Next, the frame loop →](../02-frameloop/README.md)
