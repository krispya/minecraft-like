import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Entity } from 'koota';
import { useQuery, useQueryFirst, useTag, useTrait } from 'koota/react';
import { useEffect, useMemo, useRef } from 'react';
import { AnimationAction, AnimationClip, Box3, Mesh, Object3D, Vector3 } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import minecraftCharacterUrl from '../assets/minecraft-character/source/model.gltf?url';
import {
  BoxCollider,
  Camera,
  Follows,
  IsAirborne,
  IsFirstPerson,
  IsIdle,
  IsWalking,
  Player,
  Position,
  Rotation,
  Velocity,
} from '../traits';
import { BoxColliderDebug } from './box-collider-debug';

export function PlayerRenderer() {
  const player = useQuery(Player, Position);
  return player.map((p) => <PlayerView key={p.id()} entity={p} />);
}

function PlayerView({ entity }: { entity: Entity }) {
  const { scene, animations } = useGLTF(minecraftCharacterUrl);
  const model = useMemo(() => clone(scene), [scene]);

  const box = useTrait(entity, BoxCollider);
  const modelOffset = useMemo(() => {
    const bounds = new Box3().setFromObject(model);
    const center = bounds.getCenter(new Vector3());

    return [-center.x, -bounds.min.y - (box?.size.y ?? 0) / 2, -center.z] as const;
  }, [box, model]);

  const position = useTrait(entity, Position);
  const rotation = useTrait(entity, Rotation);
  const isFirstPerson = useQueryFirst(Camera, IsFirstPerson, Follows(entity)) !== undefined;

  useCharacterAnimation(entity, animations, model);

  useEffect(() => {
    model.traverse((object) => {
      if (!(object instanceof Mesh)) return;

      object.castShadow = true;
      object.receiveShadow = true;
    });
  }, [model]);

  return (
    <>
      {!isFirstPerson && (
        <>
          <group position={position?.toArray()} quaternion={rotation?.toArray()}>
            <primitive object={model} position={modelOffset} />
          </group>
          <BoxColliderDebug entity={entity} />
        </>
      )}
    </>
  );
}

function useCharacterAnimation(entity: Entity, animations: AnimationClip[], model: Object3D) {
  const activeAction = useRef<AnimationAction | null>(null);
  const { actions } = useAnimations(animations, model);
  const isIdle = useTag(entity, IsIdle);
  const isWalking = useTag(entity, IsWalking);
  const isAirborne = useTag(entity, IsAirborne);

  useEffect(() => {
    if (!isIdle && !isWalking && !isAirborne) return;

    const nextAction = actions[isWalking ? 'walking_test' : 'still_test'];
    if (!nextAction || nextAction === activeAction.current) return;

    nextAction.reset().fadeIn(0.15).play();
    activeAction.current?.fadeOut(0.15);
    activeAction.current = nextAction;
  }, [actions, isAirborne, isIdle, isWalking]);

  useEffect(() => {
    return () => {
      activeAction.current?.stop();
      activeAction.current = null;
    };
  }, []);

  useFrame(() => {
    const walkAction = actions.walking_test;
    const velocity = entity.get(Velocity);
    if (!walkAction || !velocity) return;

    const horizontalSpeed = Math.hypot(velocity.x, velocity.z);
    const cyclesPerSecond = horizontalSpeed / 2;
    const timeScale = cyclesPerSecond * walkAction.getClip().duration;
    walkAction.timeScale = Math.min(Math.max(timeScale, 1), 8);
  });
}

useGLTF.preload(minecraftCharacterUrl);
