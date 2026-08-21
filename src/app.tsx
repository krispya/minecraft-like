import { CameraControls, PerspectiveCamera, Sky } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useActions, useTrait, useWorld } from 'koota/react';
import { useEffect } from 'react';
import { actions } from './actions';
import { Frameloop } from './frameloop';
import { Keys, Time } from './traits';

import { GroundRenderer } from './view/ground-renderer';
import { PlayerRenderer } from './view/player-renderer';

export function App() {
  return (
    <>
      <Canvas shadows camera={{ fov: 45 }}>
        <Sky sunPosition={[100, 20, 100]} />
        <ambientLight intensity={0.3 * Math.PI} />
        <pointLight castShadow intensity={0.8 * Math.PI} decay={0} position={[100, 100, 100]} />

        <PerspectiveCamera makeDefault position={[0, 10, 0]} />
        <CameraControls />

        {/* Renderers */}
        <PlayerRenderer />
        <GroundRenderer />
      </Canvas>

      <Frameloop />
      <Startup />

      <Clock />
      <KeysView />
    </>
  );
}

function Startup() {
  const { spawnPlayer, spawnGround } = useActions(actions);

  useEffect(() => {
    const players = Array.from({ length: 10 }, () =>
      spawnPlayer({
        x: (Math.random() - 0.5) * 20,
        y: Math.random() * 10,
        z: (Math.random() - 0.5) * 20,
      })
    );
    const ground = spawnGround();

    return () => {
      for (const player of players) player.destroy();
      ground.destroy();
    };
  }, [spawnGround, spawnPlayer]);

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
