import { Sky, useTexture } from '@react-three/drei/webgpu';
import { Canvas } from '@react-three/fiber/webgpu';
import { useTrait, useWorld, WorldProvider } from 'koota/react';
import { RepeatWrapping } from 'three/webgpu';
import { Frameloop } from './frameloop';
import { Time } from './time/traits';
import { world } from './world';

export function App() {
  return (
    <WorldProvider world={world}>
      <Canvas shadows camera={{ position: [4, 3, 6], fov: 45 }}>
        <Sky sunPosition={[100, 20, 100]} />
        <ambientLight intensity={0.3 * Math.PI} />
        <Sun />

        <Player />
        <Ground />
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

// A stand-in for the player, two units tall like a Minecraft character.
function Player() {
  return (
    <mesh castShadow position={[0, 1, 0]}>
      <capsuleGeometry args={[0.3, 1.4, 4, 16]} />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  );
}

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
