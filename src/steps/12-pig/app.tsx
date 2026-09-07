import { Sky } from '@react-three/drei/webgpu';
import { Canvas } from '@react-three/fiber/webgpu';
import { useTrait, useWorld, WorldProvider } from 'koota/react';
import { BlockRenderer } from './block/renderer';
import { CameraRenderer } from './camera/renderer';
import { Frameloop } from './frameloop';
import { GroundRenderer } from './ground/renderer';
import { PigRenderer } from './pig/renderer';
import { PlayerRenderer } from './player/renderer';
import { Time } from './time/traits';
import { world } from './world';

export function App() {
  return (
    <WorldProvider world={world}>
      <Canvas shadows>
        <Sky sunPosition={[100, 20, 100]} />
        <ambientLight intensity={0.3 * Math.PI} />
        <Sun />

        <PlayerRenderer />
        <PigRenderer />
        <GroundRenderer />
        <BlockRenderer />
        <CameraRenderer />
      </Canvas>

      <Frameloop />
      <Clock />
    </WorldProvider>
  );
}

function Clock() {
  const world = useWorld();
  const time = useTrait(world, Time);

  if (!time) return null;

  return (
    <div style={{ position: 'absolute', top: 8, left: 8, color: 'white', fontFamily: 'monospace' }}>
      <div>Time: {(time.current / 1000).toFixed(2)} s</div>
      <div>Delta: {(time.delta * 1000).toFixed(2)} ms</div>
    </div>
  );
}

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
