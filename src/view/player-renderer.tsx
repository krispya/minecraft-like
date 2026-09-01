import { useAnimations, useGLTF } from '@react-three/drei';
import { createPortal, useFrame } from '@react-three/fiber';
import { Entity } from 'koota';
import { useQuery, useQueryFirst, useTrait, useWorld } from 'koota/react';
import { useEffect, useMemo } from 'react';
import { AnimationClip, AnimationUtils, Box3, LoopOnce, Mesh, Object3D, Vector3 } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import minecraftCharacterUrl from '../assets/minecraft-character/source/model.gltf?url';
import {
  BoxCollider,
  Camera,
  Follows,
  HeldBy,
  IsFirstPerson,
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
  // The swing is additive so it layers over whichever locomotion clip is playing.
  const clips = useMemo(
    () =>
      animations.map((clip) =>
        clip.name === 'tool_swing' ? AnimationUtils.makeClipAdditive(clip.clone()) : clip
      ),
    [animations]
  );
  const { actions } = useAnimations(clips, model);

  useFrame((_, delta) => {
    const idleAction = actions.still_test;
    const walkAction = actions.walking_test;
    const ridingAction = actions.riding;
    if (!idleAction || !walkAction || !ridingAction) return;

    const nextAction = entity.has(IsRiding)
      ? ridingAction
      : entity.has(IsWalking)
        ? walkAction
        : idleAction;
    const locomotionActions = [idleAction, walkAction, ridingAction];

    // Keep every clip scheduled so a transition never exposes its default full weight.
    if (locomotionActions.some((action) => !action.isScheduled())) {
      for (const action of locomotionActions) {
        action
          .reset()
          .setEffectiveWeight(action === nextAction ? 1 : 0)
          .play();
      }
    } else {
      const blendStep = delta / 0.15;
      for (const action of locomotionActions) {
        const target = action === nextAction ? 1 : 0;
        const weight = action.getEffectiveWeight();
        if (weight === target) continue;

        action.setEffectiveWeight(
          weight < target
            ? Math.min(weight + blendStep, target)
            : Math.max(weight - blendStep, target)
        );
      }
    }

    const velocity = entity.get(Velocity);
    if (!velocity) return;

    const horizontalSpeed = Math.hypot(velocity.x, velocity.z);
    const cyclesPerSecond = horizontalSpeed / 2;
    const timeScale = cyclesPerSecond * walkAction.getClip().duration;
    walkAction.timeScale = Math.min(Math.max(timeScale, 1), 8);
  }, -1);

  useEffect(() => {
    const swingAction = actions.tool_swing;
    if (!swingAction) return;

    return world.onAdd(ToolSwing, (swinging) => {
      if (swinging !== entity) return;

      const { duration } = swinging.get(ToolSwing)!;
      swingAction.reset().setLoop(LoopOnce, 1).setDuration(duration).play();
    });
  }, [actions, entity, world]);
}

useGLTF.preload(minecraftCharacterUrl);
