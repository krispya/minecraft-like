import { trait } from 'koota';
import { Quaternion, Spherical, Vector2, Vector3 } from 'three';

export const Time = trait({ delta: 0, current: 0 });

export const Keys = trait(() => new Set<string>());
export const Pointer = trait({
  // Normalized device coordinates.
  position: () => new Vector2(),
  // Accumulated since the last frame.
  delta: () => new Vector2(),
  isDown: false,
});
// Positive when scrolling down.
export const Wheel = trait({ delta: 0 });
export const Input = trait({ x: 0, y: 0 });

export const Position = trait(() => new Vector3());
export const Rotation = trait(() => new Quaternion());
export const Velocity = trait(() => new Vector3());

export const BoundingBox = trait({ width: 1, height: 1, depth: 1 });
export const IsGrounded = trait();
export const Physical = trait({ mass: 1 });

export const Player = trait();
export const Ground = trait();
export const Sky = trait();

export const Camera = trait();

export const OrbitController = trait({
  // Offset from the target.
  spherical: () => new Spherical(10, Math.PI / 3, 0),
  target: () => new Vector3(),
  // Angular and log-radius velocity.
  velocity: () => new Spherical(0, 0, 0),
  rotateSpeed: 1,
  zoomSpeed: 1,
  // E-folds per second.
  damping: 8,
  minDistance: 2,
  maxDistance: 20,
});
