import { useTexture } from '@react-three/drei';
import { Entity } from 'koota';
import { useQueryFirst, useTrait } from 'koota/react';
import { RepeatWrapping } from 'three';
import { Ground, Position } from '../traits';

import grassImg from '../assets/grass.jpg';

export function GroundRenderer() {
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
