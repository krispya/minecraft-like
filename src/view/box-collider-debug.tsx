import { Entity } from 'koota';
import { useTrait } from 'koota/react';
import { BoxCollider, Position } from '../traits';

export function BoxColliderDebug({ entity }: { entity: Entity }) {
  const box = useTrait(entity, BoxCollider);
  const position = useTrait(entity, Position);

  if (!box || !position) return null;

  return (
    <mesh position={position.toArray()} renderOrder={1}>
      <boxGeometry args={box.size.toArray()} />
      <meshBasicMaterial color="red" depthTest={false} transparent wireframe />
    </mesh>
  );
}
