import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Entity } from 'koota';
import { useQuery, useTag, useTrait } from 'koota/react';
import { useEffect, useMemo } from 'react';
import { Box3, Mesh, Vector3 } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import pigUrl from '../assets/minecraft-saddled-pig/source/model.gltf?url';
import { BoxCollider, IsWalking, Pig, Position, Rotation, Velocity } from '../traits';
import { BoxColliderDebug } from './box-collider-debug';

const WALK_CLIP = 'animation.pig.walk';

export function PigRenderer() {
  const pigs = useQuery(Pig, Position);
  return pigs.map((pig) => <PigView key={pig.id()} entity={pig} />);
}

function PigView({ entity }: { entity: Entity }) {
  const { scene, animations } = useGLTF(pigUrl);
  const model = useMemo(() => clone(scene), [scene]);

  const box = useTrait(entity, BoxCollider);
  const modelOffset = useMemo(() => {
    const bounds = new Box3().setFromObject(model);
    const center = bounds.getCenter(new Vector3());

    return [-center.x, -bounds.min.y - (box?.size.y ?? 0) / 2, -center.z] as const;
  }, [box, model]);

  const position = useTrait(entity, Position);
  const rotation = useTrait(entity, Rotation);

  usePigAnimation(entity, animations, model);

  useEffect(() => {
    model.traverse((object) => {
      if (!(object instanceof Mesh)) return;

      object.castShadow = true;
      object.receiveShadow = true;
    });
  }, [model]);

  return (
    <>
      <group position={position?.toArray()} quaternion={rotation?.toArray()}>
        <primitive object={model} position={modelOffset} />
      </group>
      <BoxColliderDebug entity={entity} />
    </>
  );
}

function usePigAnimation(
  entity: Entity,
  animations: Parameters<typeof useAnimations>[0],
  model: Parameters<typeof useAnimations>[1]
) {
  const { actions } = useAnimations(animations, model);
  const isWalking = useTag(entity, IsWalking);

  useEffect(() => {
    const walkAction = actions[WALK_CLIP];
    if (!walkAction) return;

    if (isWalking) walkAction.reset().fadeIn(0.15).play();
    else walkAction.fadeOut(0.15);
  }, [actions, isWalking]);

  useFrame(() => {
    const walkAction = actions[WALK_CLIP];
    const velocity = entity.get(Velocity);
    if (!walkAction || !velocity) return;

    const horizontalSpeed = Math.hypot(velocity.x, velocity.z);
    const cyclesPerSecond = horizontalSpeed / 1.5;
    const timeScale = cyclesPerSecond * walkAction.getClip().duration;
    walkAction.timeScale = Math.min(Math.max(timeScale, 1), 4);
  });
}

useGLTF.preload(pigUrl);
