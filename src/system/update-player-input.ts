import type { World } from 'koota';
import { Vector3 } from 'three';
import { Camera, Follows, Input, Keys, Player, Rotation } from '../traits';

const UP = new Vector3(0, 1, 0);
const cameraForward = new Vector3();
const cameraRight = new Vector3();

export function updatePlayerInput(world: World) {
  const keys = world.get(Keys)!;

  world.query(Player, Input).updateEach(([input], entity) => {
    const right = keys.has('arrowright') || keys.has('d');
    const left = keys.has('arrowleft') || keys.has('a');
    const up = keys.has('arrowup') || keys.has('w');
    const down = keys.has('arrowdown') || keys.has('s');

    // Prevent faster diagonal movement.
    const x = Number(right) - Number(left);
    const y = Number(up) - Number(down);
    const length = Math.hypot(x, y) || 1;

    const localX = x / length;
    const localY = y / length;
    const cameraRotation = world.queryFirst(Camera, Follows(entity), Rotation)?.get(Rotation);

    if (cameraRotation) {
      cameraForward.set(0, 0, -1).applyQuaternion(cameraRotation);
      cameraForward.y = 0;

      if (cameraForward.lengthSq() > 0) {
        cameraForward.normalize();
        cameraRight.crossVectors(cameraForward, UP);
        input.x = cameraRight.x * localX + cameraForward.x * localY;
        input.y = -(cameraRight.z * localX + cameraForward.z * localY);
      } else {
        input.x = localX;
        input.y = localY;
      }
    } else {
      input.x = localX;
      input.y = localY;
    }

    input.jump = keys.has(' ');
  });
}
