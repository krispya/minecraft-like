import { useEffect } from 'react';
import { useWorld } from 'koota/react';
import { useKeyboard } from './input/use-keyboard';
import { usePointer } from './input/use-pointer';
import { useWheel } from './input/use-wheel';
import { applyGravity } from './system/apply-gravity';
import { subscribeCameraControllerSwap } from './system/camera-controller-swap';
import { applyFirstPerson, updateFirstPersonController } from './system/first-person-controller';
import { moveEntity } from './system/move-entity';
import { applyOrbit, moveOrbit, updateOrbitController } from './system/orbit-controller';
import { resetInputDelta } from './system/reset-input';
import { resolveBoxCollisions } from './system/resolve-box-collisions';
import { resolveBoxPlaneCollisions } from './system/resolve-box-plane-collisions';
import { updateCharacterController } from './system/update-character-controller';
import { updateCharacterState } from './system/update-character-state';
import { updateFollowTarget } from './system/update-follow-target';
import { updatePlayerInput } from './system/update-player-input';
import { updateTime } from './system/update-time';
import { updateMountInput } from './system/update-mount-input';
import { updateMounting } from './system/update-mounting';
import { updateConstruction } from './system/update-construction';
import { updateReveal } from './system/update-reveal';
import { updateRiders } from './system/update-riders';
import { updateWanderInput } from './system/update-wander-input';
import { subscribeToolSwing, updateToolSwing } from './system/tool-swing';
import { useAnimationFrame } from './utils/use-animation-frame';

export function Frameloop() {
  const world = useWorld();
  useKeyboard(world);
  usePointer(world);
  useWheel(world);

  useEffect(() => subscribeCameraControllerSwap(world), [world]);
  useEffect(() => subscribeToolSwing(world), [world]);

  useAnimationFrame(() => {
    updateTime(world);
    updateToolSwing(world);
    updateConstruction(world);
    updateReveal(world);

    updatePlayerInput(world);
    updateWanderInput(world);
    updateMountInput(world);
    updateOrbitController(world);
    updateFirstPersonController(world);

    updateCharacterController(world);
    applyGravity(world);

    moveEntity(world);
    resolveBoxPlaneCollisions(world);
    resolveBoxCollisions(world);
    updateCharacterState(world);
    updateMounting(world);
    updateRiders(world);

    updateFollowTarget(world);
    moveOrbit(world);
    applyOrbit(world);
    applyFirstPerson(world);

    resetInputDelta(world);
  });

  return null;
}
