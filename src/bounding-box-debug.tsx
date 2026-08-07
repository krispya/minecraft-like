import { Entity } from 'koota';
import { useTrait } from 'koota/react';
import { BoundingBox, Position } from './traits';

export function BoundingBoxDebug({ entity }: { entity: Entity }) {
  const boundingBox = useTrait(entity, BoundingBox);
  const position = useTrait(entity, Position);

  if (!boundingBox || !position) return null;

  return (
    <mesh position={[position.x, position.y, position.z]} renderOrder={1}>
      <boxGeometry args={[boundingBox.width, boundingBox.height, boundingBox.depth]} />
      <meshBasicMaterial color="red" depthTest={false} transparent wireframe />
    </mesh>
  );
}
