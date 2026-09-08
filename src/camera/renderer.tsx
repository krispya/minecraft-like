import { PerspectiveCamera } from '@react-three/drei/webgpu';
import { Entity } from 'koota';
import { useQuery } from 'koota/react';
import { Position, Rotation } from '../transform';
import { captureRef } from '../view/capture-ref';
import { Camera } from './traits';

export function CameraRenderer() {
  const cameras = useQuery(Camera, Position, Rotation);
  return cameras.map((entity) => <CameraView key={entity.id()} entity={entity} />);
}

function CameraView({ entity }: { entity: Entity }) {
  return <PerspectiveCamera ref={captureRef(entity)} makeDefault fov={70} />;
}
