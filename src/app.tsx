import { Sky } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useActions, useTrait, useWorld } from 'koota/react';
import { useEffect } from 'react';
import { Vector3 } from 'three';
import { actions } from './actions';
import { Frameloop } from './frameloop';
import {
  Block,
  FirstPersonController,
  Follows,
  IsThirdPerson,
  Keys,
  OrbitController,
  Time,
} from './traits';

import { BlockRenderer } from './view/block-renderer';
import { CameraRenderer } from './view/camera-renderer';
import { GroundRenderer } from './view/ground-renderer';
import { PlayerRenderer } from './view/player-renderer';

export function App() {
  return (
    <>
      <Canvas shadows camera={{ fov: 45 }}>
        <Sky sunPosition={[100, 20, 100]} />
        <ambientLight intensity={0.3 * Math.PI} />
        <pointLight castShadow intensity={0.8 * Math.PI} decay={0} position={[100, 100, 100]} />

        <PlayerRenderer />
        <GroundRenderer />
        <BlockRenderer />
        <CameraRenderer />
      </Canvas>

      <Frameloop />
      <Startup />

      <Clock />
      <KeysView />
    </>
  );
}

function Startup() {
  const world = useWorld();
  const { spawnPlayer, spawnGround, spawnBlockAt, spawnCamera } = useActions(actions);

  useEffect(() => {
    const player = spawnPlayer({ position: [0, 10, 0] });
    const ground = spawnGround();
    spawnBlockAt(new Vector3(0, 0.5, -5));
    const camera = spawnCamera();
    camera.add(
      OrbitController({ damping: 8 }),
      FirstPersonController,
      IsThirdPerson,
      Follows(player)
    );

    return () => {
      player.destroy();
      ground.destroy();
      Array.from(world.query(Block)).forEach((block) => block.destroy());
      camera.destroy();
    };
  }, [spawnBlockAt, spawnCamera, spawnGround, spawnPlayer, world]);

  return null;
}

function Clock() {
  const world = useWorld();
  const time = useTrait(world, Time);

  if (!time) return null;

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, color: 'white' }}>
      <div>Current Time: {time.current.toFixed(2)} s</div>
      <div>Delta Time: {(time.delta * 1000).toFixed(4)} ms</div>
    </div>
  );
}

function KeysView() {
  const world = useWorld();
  const keys = useTrait(world, Keys);

  if (!keys) return null;

  return (
    <div style={{ position: 'absolute', top: 50, left: 0, color: 'white' }}>
      <div>Pressed Keys: {Array.from(keys).join(', ')}</div>
    </div>
  );
}
