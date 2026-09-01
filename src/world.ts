import { createWorld } from 'koota';
import { subscribeBlockGrid } from './system/sync-block-grid';
import { Blocks, Construction, Keys, Pointer, Time, Wheel } from './traits';

export const world = createWorld(Time, Keys, Pointer, Wheel, Blocks, Construction);

subscribeBlockGrid(world);
