import type { Entity } from 'koota';
import type { Object3D } from 'three/webgpu';
import { Ref } from './traits';

// Capture the mounted object and release it when React detaches the ref.
export function captureRef(entity: Entity, ref = Ref) {
  return (object: Object3D | null) => {
    if (!object || !entity.isAlive()) return;

    if (entity.has(ref)) entity.set(ref, object);
    else entity.add(ref(object));

    return () => {
      if (entity.isAlive() && entity.get(ref) === object) entity.remove(ref);
    };
  };
}
