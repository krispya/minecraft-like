import { PerspectiveCamera } from '@react-three/drei/webgpu';
import type { Entity } from 'koota';
import { useQuery, useTraitEffect } from 'koota/react';
import { useState } from 'react';
import { type QuaternionTuple, type Vector3Tuple } from 'three/webgpu';
import { Position, Rotation } from '../transform/traits';
import { Camera } from './traits';

export function CameraRenderer() {
  const cameras = useQuery(Camera, Position, Rotation);
  return cameras.map((entity) => <CameraView key={entity.id()} entity={entity} />);
}

function CameraView({ entity }: { entity: Entity }) {
  const [position, setPosition] = useState<Vector3Tuple>();
  useTraitEffect(entity, Position, (value) => setPosition(value?.toArray()));
  const [rotation, setRotation] = useState<QuaternionTuple>();
  useTraitEffect(entity, Rotation, (value) => setRotation(value?.toArray()));

  return <PerspectiveCamera makeDefault fov={70} position={position} quaternion={rotation} />;
}
