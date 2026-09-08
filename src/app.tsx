import { Sky } from '@react-three/drei/webgpu';
import { Canvas, useFrame } from '@react-three/fiber/webgpu';
import { useActions, useQueryFirst, useTrait, useWorld } from 'koota/react';
import { useEffect, useRef } from 'react';
import { output, vec4 } from 'three/tsl';
import { type DirectionalLight, Vector3 } from 'three/webgpu';
import { actions } from './actions';
import { Frameloop } from './frameloop';
import { Block } from './block/traits';
import { Construction } from './terrain/traits';
import { FirstPersonController } from './controllers/firstPersonController';
import { Follows, IsThirdPerson } from './camera/traits';
import { OrbitController } from './controllers/orbitController';
import { Keys } from './input/traits';
import { Pig } from './character/pig/traits';
import { Player } from './character/player/traits';
import { Position } from './transform/traits';
import { Time } from './time/traits';

import { BlockRenderer } from './block/renderer';
import { CameraRenderer } from './camera/renderer';
import { FirstPersonView } from './item/renderer';
import { GroundRenderer } from './terrain/ground/renderer';
import { PigRenderer } from './character/pig/renderer';
import { PlayerRenderer } from './character/player/renderer';

export function App() {
  return (
    <>
      <Canvas shadows camera={{ fov: 45 }}>
        <Sky
          sunPosition={[100, 20, 100]}
          material-outputNode={vec4(output.rgb.pow(1 / 2.4), output.a)}
        />
        <ambientLight intensity={0.3 * Math.PI} />
        <Sun />

        <PlayerRenderer />
        <PigRenderer />
        <GroundRenderer />
        <BlockRenderer />
        <CameraRenderer />
        <FirstPersonView />
      </Canvas>

      <Frameloop />
      <Startup />

      {new URLSearchParams(window.location.search).has('debug') && (
        <>
          <Clock />
          <KeysView />
        </>
      )}
    </>
  );
}

// Where the sun sits relative to the player.
const SUN_OFFSET = new Vector3(100, 100, 100);
// Half-width of the square the sun casts shadows into, enough to cover a generated world.
const SHADOW_EXTENT = 72;

// A directional light needs one shadow pass where a point light needs six, which matters once a
// world of blocks is casting. It follows the player so the shadow area covers wherever they are.
function Sun() {
  const light = useRef<DirectionalLight>(null);
  const player = useQueryFirst(Player, Position);

  useFrame(() => {
    const sun = light.current;
    const center = player?.get(Position);
    if (!sun || !center) return;

    sun.position.copy(center).add(SUN_OFFSET);
    sun.target.position.copy(center);
    sun.target.updateMatrixWorld();
  });

  return (
    <directionalLight
      ref={light}
      castShadow
      intensity={0.8 * Math.PI}
      position={SUN_OFFSET}
      shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-SHADOW_EXTENT}
      shadow-camera-right={SHADOW_EXTENT}
      shadow-camera-top={SHADOW_EXTENT}
      shadow-camera-bottom={-SHADOW_EXTENT}
      shadow-camera-near={10}
      shadow-camera-far={400}
      shadow-bias={-0.0005}
    />
  );
}

function Startup() {
  const world = useWorld();
  const { spawnPlayer, spawnGround, spawnBlockAt, spawnCamera, spawnItem, giveItem, selectItem } =
    useActions(actions);

  useEffect(() => {
    const player = spawnPlayer({ position: [0, 10, 0] });
    // Hotbar order: 1 is a block, 2 is the hammer. The first slot starts in hand.
    const items = [spawnItem('block'), spawnItem('hammer')];
    items.forEach((item) => giveItem(player, item));
    selectItem(player, 'block');
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
      items.forEach((item) => item.destroy());
      player.destroy();
      ground.destroy();
      world.set(Construction, { pending: [], doomed: [], nextPending: 0, nextDoomed: 0, elapsed: 0 });
      Array.from(world.query(Block)).forEach((block) => block.destroy());
      Array.from(world.query(Pig)).forEach((pig) => pig.destroy());
      camera.destroy();
    };
  }, [giveItem, selectItem, spawnBlockAt, spawnCamera, spawnGround, spawnItem, spawnPlayer, world]);

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
