import { useAnimations, useGLTF } from '@react-three/drei';
import { createPortal, useFrame } from '@react-three/fiber';
import { Entity } from 'koota';
import { useQuery, useQueryFirst, useTag, useTrait, useWorld } from 'koota/react';
import { useEffect, useMemo, useRef } from 'react';
import {
  type AnimationAction,
  AnimationClip,
  AnimationUtils,
  Box3,
  LoopOnce,
  Mesh,
  Object3D,
  Vector3,
} from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import minecraftCharacterUrl from '../assets/minecraft-character/source/model.gltf?url';
import {
  BoxCollider,
  Camera,
  Follows,
  HeldBy,
  IsAirborne,
  IsFirstPerson,
  IsIdle,
  IsRiding,
  IsWalking,
  Item,
  Player,
  Position,
  Rotation,
  ToolSwing,
  Velocity,
} from '../traits';
import { BoxColliderDebug } from './box-collider-debug';
import { ItemView } from './item-view';

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
  const rightArmJoint = useMemo(() => model.getObjectByName('RightArm'), [model]);
  const heldItem = useQueryFirst(Item, HeldBy(entity));

  useCharacterAnimation(entity, animations, model);

  useEffect(() => {
    model.traverse((object) => {
      if (!(object instanceof Mesh)) return;

      object.castShadow = true;
      object.receiveShadow = true;
    });
  }, [model]);

  if (isFirstPerson) return null;

  return (
    <>
      <group position={position?.toArray()} quaternion={rotation?.toArray()}>
        <primitive object={model} position={modelOffset} />
        {rightArmJoint &&
          heldItem &&
          createPortal(<ItemView item={heldItem} display="thirdPerson" />, rightArmJoint)}
      </group>
      <BoxColliderDebug entity={entity} />
    </>
  );
}

function useCharacterAnimation(entity: Entity, animations: AnimationClip[], model: Object3D) {
  const world = useWorld();
  const activeAction = useRef<AnimationAction | null>(null);
  // The swing is additive so it layers over whichever locomotion clip is playing.
  const clips = useMemo(
    () =>
      animations.map((clip) =>
        clip.name === 'tool_swing' ? AnimationUtils.makeClipAdditive(clip.clone()) : clip
      ),
    [animations]
  );
  const { actions } = useAnimations(clips, model);
  const isIdle = useTag(entity, IsIdle);
  const isWalking = useTag(entity, IsWalking);
  const isAirborne = useTag(entity, IsAirborne);
  const isRiding = useTag(entity, IsRiding);

  useEffect(() => {
    if (!isRiding && !isIdle && !isWalking && !isAirborne) return;

    const nextAction = actions[isRiding ? 'riding' : isWalking ? 'walking_test' : 'still_test'];
    if (!nextAction || nextAction === activeAction.current) return;

    nextAction.reset().fadeIn(0.15).play();
    activeAction.current?.fadeOut(0.15);
    activeAction.current = nextAction;
  }, [actions, isAirborne, isIdle, isRiding, isWalking]);

  useEffect(() => {
    return () => {
      activeAction.current?.stop();
      activeAction.current = null;
    };
  }, []);

  useEffect(() => {
    const swingAction = actions.tool_swing;
    if (!swingAction) return;

    return world.onAdd(ToolSwing, (swinging) => {
      if (swinging !== entity) return;

      const { duration } = swinging.get(ToolSwing)!;
      swingAction.reset().setLoop(LoopOnce, 1).setDuration(duration).play();
    });
  }, [actions, entity, world]);

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
