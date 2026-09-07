import type { Entity } from 'koota';
import { useQuery, useTraitEffect } from 'koota/react';
import { useState } from 'react';
import { type Vector3Tuple } from 'three/webgpu';
import { Position } from '../transform/traits';
import { Player } from './traits';

export function PlayerRenderer() {
  const players = useQuery(Player, Position);
  return players.map((entity) => <PlayerView key={entity.id()} entity={entity} />);
}

// A stand-in for the player, two units tall like a Minecraft character.
function PlayerView({ entity }: { entity: Entity }) {
  const [position, setPosition] = useState<Vector3Tuple>();
  useTraitEffect(entity, Position, (value) => setPosition(value?.toArray()));

  return (
    <mesh castShadow position={position}>
      <capsuleGeometry args={[0.3, 1.4, 4, 16]} />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  );
}
