import { useFrame } from '@react-three/fiber/webgpu';
import { useWorld } from 'koota/react';
import { useEffect } from 'react';
import { subscribeCameraControllerSwap } from './camera/systems';
import { applyFirstPerson, updateFirstPersonController } from './controllers/firstPersonController';
import {
  applyOrbit,
  moveOrbit,
  updateOrbitController,
  updateFollowTarget,
} from './controllers/orbitController';
import { updateCharacterController } from './controllers/characterController';
import { updateCharacterState } from './character/stateMachine';
import { useKeyboard, usePointer, useWheel } from './input/hooks';
import { resetInputDelta } from './input/systems';
import { subscribeToolSwing, updateToolSwing } from './item/systems';
import { updateWanderInput } from './character/wander';
import {
  applyGravity,
  moveEntity,
  resolveBoxCollisions,
  resolveBoxPlaneCollisions,
} from './physics/systems';
import { updatePlayerInput } from './character/player/systems';
import { updateMountInput, updateMounting, updateRiders } from './riding/systems';
import { updateConstruction, updateReveal } from './terrain/systems';
import { updateTime } from './time/systems';
import { syncTransforms } from './view/systems';

// The tick. Every domain's systems run here in one global order, since the order is a property of
// the whole app and no domain can own it.
export function Frameloop() {
  const world = useWorld();
  useKeyboard(world);
  usePointer(world);
  useWheel(world);

  useEffect(() => subscribeCameraControllerSwap(world), [world]);
  useEffect(() => subscribeToolSwing(world), [world]);

  useFrame(
    () => {
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
      syncTransforms(world);
    },
    { before: 'update' }
  );

  return null;
}
