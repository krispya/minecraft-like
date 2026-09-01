import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Entity } from 'koota';
import { useQuery, useTrait } from 'koota/react';
import { useEffect, useMemo, useRef } from 'react';
import { AnimationAction, Box3, MathUtils, Mesh, Vector3 } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import minecraftCharacterUrl from '../assets/minecraft-character/source/model.gltf?url';
import { IsGrounded, Player, Position, Rotation, Velocity } from '../traits';
import { BoxColliderDebug } from './box-collider-debug';

const IDLE_ANIMATION = 'still_test';
const WALK_ANIMATION = 'walking_test';
const WALKING_SPEED_THRESHOLD = 0.1;
const WALK_CYCLE_DISTANCE = 2;

export function PlayerRenderer() {
  const player = useQuery(Player, Position);
  return player.map((p) => <PlayerView key={p.id()} entity={p} />);
}

function PlayerView({ entity }: { entity: Entity }) {
  const activeAction = useRef<AnimationAction | null>(null);
  const { scene, animations } = useGLTF(minecraftCharacterUrl);
  const model = useMemo(() => clone(scene), [scene]);
  const modelOffset = useMemo(() => {
    const center = new Box3().setFromObject(model).getCenter(new Vector3());
    return center.multiplyScalar(-1).toArray();
  }, [model]);
  const { actions } = useAnimations(animations, model);
  const position = useTrait(entity, Position);
  const rotation = useTrait(entity, Rotation);

  useEffect(() => {
    model.traverse((object) => {
      if (!(object instanceof Mesh)) return;

      object.castShadow = true;
      object.receiveShadow = true;
    });

    return () => {
      activeAction.current?.stop();
      activeAction.current = null;
    };
  }, [model]);

  useFrame(() => {
    const velocity = entity.get(Velocity);
    const horizontalSpeed = velocity === undefined ? 0 : Math.hypot(velocity.x, velocity.z);
    const isWalking = entity.has(IsGrounded) && horizontalSpeed > WALKING_SPEED_THRESHOLD;
    const walkAction = actions[WALK_ANIMATION];

    if (walkAction) {
      const cyclesPerSecond = horizontalSpeed / WALK_CYCLE_DISTANCE;
      walkAction.timeScale = MathUtils.clamp(cyclesPerSecond * walkAction.getClip().duration, 1, 8);
    }

    const nextAction = actions[isWalking ? WALK_ANIMATION : IDLE_ANIMATION];

    if (!nextAction || nextAction === activeAction.current) return;

    nextAction.reset().fadeIn(0.15).play();
    activeAction.current?.fadeOut(0.15);
    activeAction.current = nextAction;
  });

  return (
    <>
      <group position={position?.toArray()} quaternion={rotation?.toArray()}>
        <primitive object={model} position={modelOffset} />
      </group>
      <BoxColliderDebug entity={entity} />
    </>
  );
}

useGLTF.preload(minecraftCharacterUrl);
