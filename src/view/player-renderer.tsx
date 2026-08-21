import { Capsule } from '@react-three/drei';
import { Entity } from 'koota';
import { useQuery, useTrait } from 'koota/react';
import { Player, Position } from '../traits';
import { BoundingBoxDebug } from './bounding-box-debug';

export function PlayerRenderer() {
  const player = useQuery(Player, Position);
  return player.map((p) => <PlayerView key={p.id()} entity={p} />);
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
