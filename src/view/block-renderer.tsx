import { useTexture } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import type { Entity } from 'koota';
import { useActions, useQuery, useTrait } from 'koota/react';
import { actions } from '../actions';
import dirtImg from '../assets/dirt.jpg';
import { Block, BlockDamage, Position } from '../traits';

export function BlockRenderer() {
  const blocks = useQuery(Block, Position);
  return blocks.map((entity) => <BlockView key={entity.id()} entity={entity} />);
}

function BlockView({ entity }: { entity: Entity }) {
  const { placeBlock, startMining, stopMining } = useActions(actions);
  const position = useTrait(entity, Position);
  const damage = useTrait(entity, BlockDamage);
  const texture = useTexture(dirtImg);
  // Darkens as the block takes hits.
  const brightness = damage ? 1 - 0.6 * (damage.hits / damage.hitsToBreak) : 1;

  const handleMine = (event: ThreeEvent<PointerEvent>) => {
    if (event.button !== 0) return;

    event.stopPropagation();
    startMining(entity, event.point);
  };

  const handlePlace = (event: ThreeEvent<MouseEvent>) => {
    event.nativeEvent.preventDefault();
    event.stopPropagation();
    if (event.face) placeBlock(entity, { point: event.point, normal: event.face.normal });
  };

  return (
    <mesh
      castShadow
      receiveShadow
      position={position?.toArray()}
      onPointerDown={handleMine}
      onPointerLeave={stopMining}
      onContextMenu={handlePlace}
    >
      <boxGeometry />
      <meshStandardMaterial map={texture} color={[brightness, brightness, brightness]} />
    </mesh>
  );
}
