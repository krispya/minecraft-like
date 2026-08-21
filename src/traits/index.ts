import { trait } from 'koota';
import { Quaternion, Vector3 } from 'three';

export const Time = trait({ delta: 0, current: 0 });

export const Keys = trait(() => new Set<string>());
export const Input = trait({ x: 0, y: 0 });

export const Position = trait(() => new Vector3());
export const Rotation = trait(() => new Quaternion());
export const Velocity = trait(() => new Vector3());

// Physical
export const BoundingBox = trait({ width: 1, height: 1, depth: 1 });
export const IsGrounded = trait();
export const Physical = trait({ mass: 1 });

export const Player = trait();
export const Ground = trait();
export const Sky = trait();

export const Camera = trait();
