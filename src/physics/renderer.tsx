import { Entity } from 'koota';
import { useTrait } from 'koota/react';
import { captureRef } from '../view/capture-ref';
import { ColliderDebugRef } from '../view/traits';
import { BoxCollider } from './traits';

export function BoxColliderDebug({ entity }: { entity: Entity }) {
  const box = useTrait(entity, BoxCollider);

  if (!box || !new URLSearchParams(window.location.search).has('debug')) return null;

  return (
    <mesh ref={captureRef(entity, ColliderDebugRef)} renderOrder={1}>
      <boxGeometry args={box.size.toArray()} />
      <meshBasicMaterial color="red" depthTest={false} transparent wireframe />
    </mesh>
  );
}
