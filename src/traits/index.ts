import { trait } from 'koota';

export const Time = trait({ delta: 0, current: 0 });

export const Position = trait({ x: 0, y: 0, z: 0 });
export const Velocity = trait({ x: 0, y: 0, z: 0 });

export const Player = trait();
export const Ground = trait();
export const Sky = trait();

export const Camera = trait();
