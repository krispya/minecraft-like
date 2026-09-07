import { createWorld } from 'koota';
import { actions } from './actions';
import { Time } from './time/traits';

export const world = createWorld(Time);

const { spawnPlayer, spawnCamera } = actions(world);
spawnPlayer({ position: [0, 1, 0] });
spawnCamera({ position: [4, 2, 6], target: [0, 1, 0] });

if (import.meta.hot) import.meta.hot.dispose(() => world.destroy());
