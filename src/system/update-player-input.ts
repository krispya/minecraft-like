import type { World } from 'koota';
import { Input, Keys, Player } from '../traits';

export function updatePlayerInput(world: World) {
  const keys = world.get(Keys)!;

  world.query(Player, Input).updateEach(([input]) => {
    const right = keys.has('arrowright') || keys.has('d');
    const left = keys.has('arrowleft') || keys.has('a');
    const up = keys.has('arrowup') || keys.has('w');
    const down = keys.has('arrowdown') || keys.has('s');

    // Prevent faster diagonal movement.
    const x = Number(right) - Number(left);
    const y = Number(up) - Number(down);
    const length = Math.hypot(x, y) || 1;

    input.x = x / length;
    input.y = y / length;
    input.jump = keys.has(' ');
  });
}
