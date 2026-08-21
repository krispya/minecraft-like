import { createWorld } from 'koota';
import { Keys, Pointer, Time, Wheel } from './traits';

export const world = createWorld(Time, Keys, Pointer, Wheel);
