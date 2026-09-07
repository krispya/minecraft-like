import { Sky, useTexture } from '@react-three/drei/webgpu';
import { Canvas } from '@react-three/fiber/webgpu';
import { RepeatWrapping } from 'three/webgpu';

export function App() {
  return (
    <Canvas shadows camera={{ position: [4, 1.5, 6], fov: 45 }}>
      <Sky sunPosition={[100, 20, 100]} />
      <ambientLight intensity={0.3 * Math.PI} />
      <Sun />

      <Ground />
    </Canvas>
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
