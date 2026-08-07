import { CameraControls, Capsule, PerspectiveCamera, Sky, useTexture } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Entity } from 'koota';
import { useActions, useQueryFirst, useTrait, useWorld } from 'koota/react';
import { useEffect } from 'react';
import { actions } from './actions';
import { BoundingBoxDebug } from './bounding-box-debug';
import { Frameloop } from './frameloop';
import { Ground, Player, Position, Time } from './traits';
import { RepeatWrapping } from 'three';

import grassImg from './assets/grass.jpg';

export function App() {
  return (
    <>
      <Canvas shadows camera={{ fov: 45 }}>
        <Sky sunPosition={[100, 20, 100]} />
        <ambientLight intensity={0.3 * Math.PI} />
        <pointLight castShadow intensity={0.8 * Math.PI} decay={0} position={[100, 100, 100]} />
        <PerspectiveCamera makeDefault position={[0, 10, 0]} />
        <CameraControls />
        <PlayerRenderer />
        <GroundRenderer />
      </Canvas>

      <Frameloop />
      <Startup />

      <Clock />
    </>
  );
}

function PlayerRenderer() {
  const player = useQueryFirst(Player, Position);
  return player ? <PlayerView key={player.id()} entity={player} /> : null;
}

function PlayerView({ entity }: { entity: Entity }) {
  const position = useTrait(entity, Position) ?? { x: 0, y: 0, z: 0 };
  return (
    <>
      <Capsule args={[0.5, 1.8]} position={[position.x, position.y, position.z]} />
      <BoundingBoxDebug entity={entity} />
    </>
  );
}

function GroundRenderer() {
  const ground = useQueryFirst(Ground, Position);
  return ground ? <GroundView key={ground.id()} entity={ground} /> : null;
}

function GroundView({ entity }: { entity: Entity }) {
  const texture = useTexture(grassImg);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  const position = useTrait(entity, Position) ?? { x: 0, y: 0, z: 0 };

  return (
    <mesh receiveShadow position={[position.x, position.y, position.z]} rotation-x={-Math.PI / 2}>
      <planeGeometry args={[1000, 1000]} />
      <meshStandardMaterial map={texture} map-repeat={[240, 240]} color="green" />
    </mesh>
  );
}

function Startup() {
  const { spawnPlayer, spawnGround } = useActions(actions);

  useEffect(() => {
    const player = spawnPlayer();
    const ground = spawnGround();

    return () => {
      player.destroy();
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
