import { Clone, useGLTF } from '@react-three/drei';
import hammerUrl from '../assets/hammer.glb?url';

// Adapted from Minecraft Diamond Axe by Blender3D, licensed CC BY 4.0
// https://sketchfab.com/models/0d62f4d3676545c88ec8523213c055dd

// Hangs from the third-person character's right arm joint.
export function ThirdPersonHammer() {
  return (
    <group position={[0, -0.66, -0.04]} rotation={[-2.35, 0, -0.2]} scale={1.25}>
      <group rotation={[0, Math.PI / 1.8, -0.3]} scale={0.5}>
        <Hammer />
      </group>
    </group>
  );
}

// Fits the hammer into Minecraft's item space, a unit cube centered on the origin where a
// handheld sprite would lie in the XY plane. The hammer runs along the sprite's bottom-left to
// top-right diagonal, the way a pickaxe does, so Minecraft's hand transforms hold it correctly.
export function FirstPersonHammer() {
  return (
    <group position={[-0.37, -0.37, 0]} rotation={[0, 0, -Math.PI / 4]} scale={1.3}>
      <Hammer />
    </group>
  );
}

function Hammer() {
  const { scene } = useGLTF(hammerUrl);
  return <Clone object={scene} castShadow />;
}

useGLTF.preload(hammerUrl);
