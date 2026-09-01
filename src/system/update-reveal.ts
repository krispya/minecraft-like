import type { World } from 'koota';
import { Reveal, Time } from '../traits';

// Counts each revealed block toward its cue. Views animate off the elapsed time; once a block has
// fully risen the trait comes off so it stops costing anything.
export function updateReveal(world: World) {
  const { delta } = world.get(Time)!;

  world.query(Reveal).updateEach(([reveal]) => {
    reveal.elapsed += delta;
  });

  world.query(Reveal).forEach((entity) => {
    const { delay, elapsed, duration } = entity.get(Reveal)!;
    if (elapsed >= delay + duration) entity.remove(Reveal);
  });
}
