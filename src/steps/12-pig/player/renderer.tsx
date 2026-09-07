import { useAnimations, useGLTF } from '@react-three/drei/webgpu';
import { createPortal, useFrame } from '@react-three/fiber/webgpu';
import type { Entity } from 'koota';
import { useQuery, useTag, useTrait, useTraitEffect, useWorld } from 'koota/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type AnimationAction,
  type AnimationClip,
  AnimationUtils,
  Box3,
  LoopOnce,
  MathUtils,
  Mesh,
  type Object3D,
  type QuaternionTuple,
  Vector3,
  type Vector3Tuple,
} from 'three/webgpu';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { IsWalking } from '../character/traits';
import { HeldAxe } from '../item/renderer';
import { ToolSwing } from '../item/traits';
import { BoxCollider, Velocity } from '../physics/traits';
import { Position, Rotation } from '../transform/traits';
import { Player } from './traits';

// Minecraft idle and walking animation by fabizok, licensed CC BY 4.0
// https://sketchfab.com/3d-models/minecraft-idle-and-walking-animation-a3f0270cc1ef42d59be153204d03b0f8
const MODEL_URL = '/minecraft-character/source/model.gltf';

export function PlayerRenderer() {
  const players = useQuery(Player, Position);
  return players.map((entity) => <PlayerView key={entity.id()} entity={entity} />);
}

function PlayerView({ entity }: { entity: Entity }) {
  const { scene, animations } = useGLTF(MODEL_URL);
  // The loaded scene is shared. A skinned mesh needs its bones cloned along with it.
  const model = useMemo(() => clone(scene), [scene]);

  // The entity's Position is the middle of its collider, so shift the model to stand on the
  // collider's bottom, centered.
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
  const rightArm = useMemo(() => model.getObjectByName('RightArm'), [model]);

  useCharacterAnimation(entity, animations, model);

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
      {rightArm && createPortal(<HeldAxe />, rightArm, { injectScene: false })}
    </group>
  );
}

// Plays the clip for the character's state. The model has no jump clip, so in the air it idles.
function useCharacterAnimation(entity: Entity, animations: AnimationClip[], model: Object3D) {
  const world = useWorld();
  // The swing is additive so it layers over whichever clip is playing.
  const clips = useMemo(
    () =>
      animations.map((clip) =>
        clip.name === 'tool_swing' ? AnimationUtils.makeClipAdditive(clip.clone()) : clip
      ),
    [animations]
  );
  const { actions } = useAnimations(clips, model);
  const isWalking = useTag(entity, IsWalking);
  const active = useRef<AnimationAction | null>(null);

  // Cross-fade whenever the state changes.
  useEffect(() => {
    const next = actions[isWalking ? 'walking_test' : 'still_test'];
    if (!next || next === active.current) return;

    next.reset().fadeIn(0.15).play();
    active.current?.fadeOut(0.15);
    active.current = next;
  }, [actions, isWalking]);

  useEffect(() => {
    return () => {
      active.current?.stop();
      active.current = null;
    };
  }, []);

  // Swing once each time a ToolSwing is added to this entity.
  useEffect(() => {
    const swing = actions.tool_swing;
    if (!swing) return;

    return world.onAdd(ToolSwing, (swinging) => {
      if (swinging !== entity) return;

      const { duration } = swinging.get(ToolSwing)!;
      swing.reset().setLoop(LoopOnce, 1).setDuration(duration).play();
    });
  }, [actions, entity, world]);

  // Match the stride to the speed. One walk cycle covers about two units of ground.
  useFrame(() => {
    const walk = actions.walking_test;
    const velocity = entity.get(Velocity);
    if (!walk || !velocity) return;

    const horizontalSpeed = Math.hypot(velocity.x, velocity.z);
    const cyclesPerSecond = horizontalSpeed / 2;
    walk.timeScale = MathUtils.clamp(cyclesPerSecond * walk.getClip().duration, 1, 8);
  });
}

useGLTF.preload(MODEL_URL);
