import { relation, trait } from 'koota';
import { Quaternion, Spherical, Vector2, Vector3 } from 'three';

export const Time = trait({ delta: 0, current: 0 });

export const Keys = trait(() => new Set<string>());
export const Pointer = trait({
  // Normalized device coordinates.
  position: () => new Vector2(),
  // Accumulated since the last frame.
  delta: () => new Vector2(),
  // Held buttons bitmask, like MouseEvent.buttons.
  buttons: 0,
});
// Positive when scrolling down.
export const Wheel = trait({ delta: 0 });
export const Input = trait({ x: 0, y: 0, jump: false });

export const Position = trait(() => new Vector3());
export const Rotation = trait(() => new Quaternion());
export const Velocity = trait(() => new Vector3());

export const CharacterController = trait({
  maxSpeed: 5,
  acceleration: 50,
  friction: 70,
  gravity: -24,
  jumpSpeed: 8,
  turnSpeed: 10,
});
export const BlockInteraction = trait({ range: 4.5, eyeHeight: 0.75 });
export const IsIdle = trait();
export const IsWalking = trait();
export const IsAirborne = trait();
// Six Minecraft ticks.
export const ToolSwing = trait({ elapsed: 0, duration: 0.3 });
// Box colliders remain aligned with the world when an entity rotates.
export const BoxCollider = trait({ size: () => new Vector3(1, 1, 1) });
export const PlaneCollider = trait({ normal: () => new Vector3(0, 1, 0) });
export const IsGrounded = trait();
export const DynamicBody = trait({ mass: 1 });

export const Player = trait();
export const Ground = trait();
export const Block = trait();
export const BlockDamage = trait({ hits: 0, hitsToBreak: 3 });
// The block the player is holding the mouse button on.
export const Mining = relation({ exclusive: true });
export const Sky = trait();

export type ItemKind = 'hammer';
export const Item = trait({ kind: 'hammer' as ItemKind });
// Item to holder, so views can query the item held by a given entity.
export const HeldBy = relation({ exclusive: true });

export const Camera = trait();
export const Follows = relation({ exclusive: true });
export const IsFirstPerson = trait();
export const IsThirdPerson = trait();

export const FirstPersonController = trait({
  offset: () => new Vector3(0, 0.75, 0),
  yaw: 0,
  pitch: 0,
  rotateSpeed: 1,
});

export const OrbitController = trait({
  // Offset from the target.
  spherical: () => new Spherical(4, Math.PI / 3, 0),
  target: () => new Vector3(),
  // Angular and log-radius velocity.
  velocity: () => new Spherical(0, 0, 0),
  rotateSpeed: 1,
  zoomSpeed: 1,
  // E-folds per second.
  damping: 8,
  minDistance: 2,
  maxDistance: 4,
});
