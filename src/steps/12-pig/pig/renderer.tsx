import { useAnimations, useGLTF } from '@react-three/drei/webgpu';
import { useFrame } from '@react-three/fiber/webgpu';
import type { Entity } from 'koota';
import { useQuery, useTag, useTrait, useTraitEffect } from 'koota/react';
import { useEffect, useMemo, useState } from 'react';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import {
  Box3,
  MathUtils,
  Mesh,
  type QuaternionTuple,
  Vector3,
  type Vector3Tuple,
} from 'three/webgpu';
import { IsWalking } from '../character/traits';
import { BoxCollider, Velocity } from '../physics/traits';
import { Position, Rotation } from '../transform/traits';
import { Pig } from './traits';

// Minecraft Saddled Pig by Nasabeat, licensed CC BY 4.0
// https://sketchfab.com/3d-models/minecraft-saddled-pig-22a686ae544e41bfa640bc757e61d7a9
const MODEL_URL = '/minecraft-saddled-pig/source/model.gltf';

export function PigRenderer() {
  const pigs = useQuery(Pig, Position);
  return pigs.map((entity) => <PigView key={entity.id()} entity={entity} />);
}

function PigView({ entity }: { entity: Entity }) {
  const { scene, animations } = useGLTF(MODEL_URL);
  const model = useMemo(() => clone(scene), [scene]);

  const box = useTrait(entity, BoxCollider);
  const modelOffset = useMemo(() => {
    const bounds = new Box3().setFromObject(model);
    const center = bounds.getCenter(new Vector3());

    return [-center.x, -bounds.min.y - (box?.size.y ?? 0) / 2, -center.z] as const;
  }, [box, model]);

  const [position, setPosition] = useState<Vector3Tuple>();
  useTraitEffect(entity, Position, (value) => setPosition(value?.toArray()));
  const [rotation, setRotation] = useState<QuaternionTuple>();
  useTraitEffect(entity, Rotation, (value) => setRotation(value?.toArray()));

  usePigAnimation(entity, animations, model);

  useEffect(() => {
    model.traverse((object) => {
      if (!(object instanceof Mesh)) return;

      object.castShadow = true;
      object.receiveShadow = true;
    });
  }, [model]);

  return (
    <group position={position} quaternion={rotation}>
      <primitive object={model} position={modelOffset} />
    </group>
  );
}

// Fade the pig's walk clip in and out with the walking state.
function usePigAnimation(
  entity: Entity,
  animations: Parameters<typeof useAnimations>[0],
  model: Parameters<typeof useAnimations>[1]
) {
  const { actions } = useAnimations(animations, model);
  const isWalking = useTag(entity, IsWalking);

  useEffect(() => {
    const walk = actions['animation.pig.walk'];
    if (!walk) return;

    if (isWalking) walk.reset().fadeIn(0.15).play();
    else walk.fadeOut(0.15);
  }, [actions, isWalking]);

  // Match the trot to the speed. One cycle covers about a unit and a half of ground.
  useFrame(() => {
    const walk = actions['animation.pig.walk'];
    const velocity = entity.get(Velocity);
    if (!walk || !velocity) return;

    const horizontalSpeed = Math.hypot(velocity.x, velocity.z);
    const cyclesPerSecond = horizontalSpeed / 1.5;
    walk.timeScale = MathUtils.clamp(cyclesPerSecond * walk.getClip().duration, 1, 4);
  });
}

useGLTF.preload(MODEL_URL);
