import { MathUtils } from 'three';
import { getBlockMaterial, useBlockTextures } from './block-materials';

const DEG = MathUtils.DEG2RAD;

// Hangs from the third-person character's right arm joint, tilted forward the way Minecraft's
// `thirdperson_righthand` block display is.
export function ThirdPersonBlock() {
  return (
    <group position={[0, -0.7, -0.1]} rotation={[75 * DEG, 45 * DEG, 0]} scale={0.375}>
      <BlockModel />
    </group>
  );
}

// A unit cube on the origin, Minecraft's block model space, so the hand display transforms fit.
export function FirstPersonBlock() {
  return <BlockModel />;
}

// The block that gets placed is dirt, so that is what shows in hand.
function BlockModel() {
  const textures = useBlockTextures();
  const material = getBlockMaterial('dirt', textures);

  return (
    <mesh material={material} castShadow>
      <boxGeometry />
    </mesh>
  );
}
