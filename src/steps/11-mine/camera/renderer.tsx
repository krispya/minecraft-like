import { PerspectiveCamera } from '@react-three/drei/webgpu';
import type { Entity } from 'koota';
import { useQuery, useTrait } from 'koota/react';
import { Position, Rotation } from '../transform/traits';
import { Camera } from './traits';

export function CameraRenderer() {
  const cameras = useQuery(Camera, Position, Rotation);
  return cameras.map((entity) => <CameraView key={entity.id()} entity={entity} />);
}

function CameraView({ entity }: { entity: Entity }) {
  const position = useTrait(entity, Position);
  const rotation = useTrait(entity, Rotation);

  return (
    <PerspectiveCamera
      makeDefault
      fov={70}
      position={position?.toArray()}
      quaternion={rotation?.toArray()}
    />
  );
}
