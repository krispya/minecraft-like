import { useTexture } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import type { Entity } from 'koota';
import { useActions, useQuery, useTrait } from 'koota/react';
import { actions } from '../actions';
import dirtImg from '../assets/dirt.jpg';
import { Block, Position } from '../traits';

export function BlockRenderer() {
  const blocks = useQuery(Block, Position);
  return blocks.map((entity) => <BlockView key={entity.id()} entity={entity} />);
}

function BlockView({ entity }: { entity: Entity }) {
  const { placeBlock } = useActions(actions);
  const position = useTrait(entity, Position);
  const texture = useTexture(dirtImg);

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (event.face) placeBlock(entity, { point: event.point, normal: event.face.normal });
  };

  return (
    <mesh castShadow receiveShadow position={position?.toArray()} onClick={handleClick}>
      <boxGeometry />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}
