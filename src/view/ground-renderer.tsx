import { useTexture } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { Entity } from 'koota';
import { useActions, useQueryFirst, useTrait } from 'koota/react';
import { RepeatWrapping } from 'three';
import { actions } from '../actions';
import { Ground, Position } from '../traits';

import grassImg from '../assets/grass.jpg';

export function GroundRenderer() {
  const ground = useQueryFirst(Ground, Position);
  return ground ? <GroundView key={ground.id()} entity={ground} /> : null;
}

function GroundView({ entity }: { entity: Entity }) {
  const { placeBlock } = useActions(actions);
  const texture = useTexture(grassImg);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  const position = useTrait(entity, Position);

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (event.face) placeBlock(entity, { point: event.point, normal: event.face.normal });
  };

  return (
    <mesh
      receiveShadow
      position={position?.toArray()}
      rotation-x={-Math.PI / 2}
      onClick={handleClick}
    >
      <planeGeometry args={[1000, 1000]} />
      <meshStandardMaterial map={texture} map-repeat={[240, 240]} color="green" />
    </mesh>
  );
}
