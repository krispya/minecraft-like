import { PerspectiveCamera } from '@react-three/drei/webgpu';
import type { Entity } from 'koota';
import { useQuery, useTraitEffect } from 'koota/react';
import { useRef } from 'react';
import type { PerspectiveCamera as CameraObject } from 'three/webgpu';
import { Position, Rotation } from '../transform/traits';
import { Camera } from './traits';

export function CameraRenderer() {
  const cameras = useQuery(Camera, Position, Rotation);
  return cameras.map((entity) => <CameraView key={entity.id()} entity={entity} />);
}

function CameraView({ entity }: { entity: Entity }) {
  const camera = useRef<CameraObject>(null);
  useTraitEffect(entity, Position, (position) => {
    if (position) camera.current?.position.copy(position);
  });
  useTraitEffect(entity, Rotation, (rotation) => {
    if (rotation) camera.current?.quaternion.copy(rotation);
  });

  return <PerspectiveCamera ref={camera} makeDefault fov={70} />;
}
