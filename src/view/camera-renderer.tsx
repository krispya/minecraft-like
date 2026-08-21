import { PerspectiveCamera } from '@react-three/drei';
import { Entity } from 'koota';
import { useQuery, useTrait } from 'koota/react';
import { Camera, Position, Rotation } from '../traits';

export function CameraRenderer() {
  const cameras = useQuery(Camera, Position, Rotation);
  return cameras.map((entity) => <CameraView key={entity.id()} entity={entity} />);
}

function CameraView({ entity }: { entity: Entity }) {
  const position = useTrait(entity, Position) ?? { x: 0, y: 0, z: 0 };
  const positionArray = [position.x, position.y, position.z] as [number, number, number];

  const rotation = useTrait(entity, Rotation) ?? { x: 0, y: 0, z: 0, w: 0 };
  // prettier-ignore
  const rotationArray = [rotation.x, rotation.y, rotation.z, rotation.w] as [number, number, number, number];

  return <PerspectiveCamera makeDefault position={positionArray} quaternion={rotationArray} />;
}
