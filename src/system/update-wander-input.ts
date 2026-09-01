import type { World } from 'koota';
import { Input, IsGrounded, Rides, Time, Velocity, Wander } from '../traits';

const BLOCKED_SPEED = 0.1;
const BLOCKED_SECONDS = 0.3;

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

export function updateWanderInput(world: World) {
  const { delta } = world.get(Time)!;

  world.query(Wander, Input, Velocity).updateEach(([wander, input, velocity], entity) => {
    // A rider is steering, so the mount has no mind of its own.
    if (world.queryFirst(Rides(entity))) return;

    const isWalking = wander.heading.lengthSq() > 0;
    wander.timer -= delta;

    // Walking into a block goes nowhere, so give up on that heading early.
    if (isWalking && entity.has(IsGrounded) && Math.hypot(velocity.x, velocity.z) < BLOCKED_SPEED) {
      wander.blocked += delta;
    } else {
      wander.blocked = 0;
    }

    if (wander.timer <= 0 || wander.blocked >= BLOCKED_SECONDS) {
      wander.blocked = 0;

      if (isWalking) {
        wander.heading.set(0, 0);
        wander.timer = randomBetween(wander.minRest, wander.maxRest);
      } else {
        const angle = Math.random() * Math.PI * 2;
        wander.heading.set(Math.cos(angle), Math.sin(angle));
        wander.timer = randomBetween(wander.minWalk, wander.maxWalk);
      }
    }

    input.x = wander.heading.x;
    input.y = wander.heading.y;
    input.jump = false;
  });
}
