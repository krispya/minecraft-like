import type { Entity } from 'koota';
import { useQuery, useTraitEffect } from 'koota/react';
import { useRef } from 'react';
import type { Mesh } from 'three/webgpu';
import { Position } from '../transform/traits';
import { Player } from './traits';

export function PlayerRenderer() {
  const players = useQuery(Player, Position);
  return players.map((entity) => <PlayerView key={entity.id()} entity={entity} />);
}

// A stand-in for the player, two units tall like a Minecraft character.
function PlayerView({ entity }: { entity: Entity }) {
  const mesh = useRef<Mesh>(null);
  useTraitEffect(entity, Position, (position) => {
    if (position) mesh.current?.position.copy(position);
  });

  return (
    <mesh ref={mesh} castShadow>
      <capsuleGeometry args={[0.3, 1.4, 4, 16]} />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  );
}
