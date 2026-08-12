import type { World } from 'koota';
import { Input, Keys, Player } from '../traits';

export function pollKeys(world: World) {
  const keys = world.get(Keys)!;

  world.query(Player, Input).updateEach(([input]) => {
    const right = keys.has('arrowright') || keys.has('d');
    const left = keys.has('arrowleft') || keys.has('a');
    const up = keys.has('arrowup') || keys.has('w');
    const down = keys.has('arrowdown') || keys.has('s');

    // Normalize the input vectors so diagonals don't
    // have a larger length than 1
    const x = Number(right) - Number(left);
    const y = Number(up) - Number(down);
    const length = Math.hypot(x, y) || 1;

    input.x = x / length;
    input.y = y / length;
  });
}
