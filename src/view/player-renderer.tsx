import { Capsule } from '@react-three/drei';
import { Entity } from 'koota';
import { useQuery, useTrait } from 'koota/react';
import { ComponentRef, useRef } from 'react';
import { Player, Position } from '../traits';
import { BoundingBoxDebug } from './bounding-box-debug';

export function PlayerRenderer() {
  const player = useQuery(Player, Position);
  return player.map((p) => <PlayerView key={p.id()} entity={p} />);
}

function PlayerView({ entity }: { entity: Entity }) {
  const ref = useRef<ComponentRef<typeof Capsule>>(null);
  const position = useTrait(entity, Position);

  return (
    <>
      <Capsule ref={ref} args={[0.5, 1.8]} position={position?.toArray()} />
      <BoundingBoxDebug entity={entity} />
    </>
  );
}
