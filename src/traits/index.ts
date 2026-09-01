import { type Entity, relation, trait } from 'koota';
import { Quaternion, Spherical, Vector2, Vector3 } from 'three';
import { BlockGrid } from '../block-grid';

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
// `mount` asks to climb on or off and is cleared by the tick that handles it.
export const Input = trait({ x: 0, y: 0, jump: false, mount: false });

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
// Character states, exclusive: see transitionCharacter.
export const IsIdle = trait();
export const IsWalking = trait();
export const IsAirborne = trait();
// Riders keep their collider but sit out of physics while mounted.
export const IsRiding = trait();
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

export type ItemKind = 'block' | 'hammer';
export const Item = trait({ kind: 'hammer' as ItemKind });
// Item to owner, for everything an entity carries whether or not it is in hand.
export const CarriedBy = relation({ exclusive: true });
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

export const Npc = trait();
export const Pig = trait();
// Random stroll: rest for a while, then walk in a random direction for a while.
export const Wander = trait({
  // Unit vector in Input space, or zero while resting.
  heading: () => new Vector2(),
  // Seconds left in the current rest or walk.
  timer: 0,
  // Seconds spent pushing against something while walking.
  blocked: 0,
  minRest: 1,
  maxRest: 4,
  minWalk: 1,
  maxWalk: 3,
  // Fraction of the controller's max speed to amble at.
  speed: 0.25,
});

// Something a character can sit on. The seat is where the rider's Position goes, in local space.
// Forward is -z, so a positive z sits the rider further back.
export const Rideable = trait({ seat: () => new Vector3(0, 0.75, 0.3) });
export const Rides = relation({ exclusive: true });

export type BlockKindName = 'grass' | 'dirt' | 'stone' | 'sand' | 'log' | 'leaves' | 'water' | 'snow';
export const BlockKind = trait({ kind: 'dirt' as BlockKindName });
// Blocks from world generation, so a new world only replaces the previous one.
export const Terrain = trait();
// World trait: every block entity indexed by cell.
export const Blocks = trait(() => new BlockGrid());
// Rises into place after a cue, so a new world can ripple outward from the player.
export const Reveal = trait({ delay: 0, elapsed: 0, duration: 0.4 });

export type PendingBlock = { x: number; y: number; z: number; kind: BlockKindName; delay: number };
export type DoomedBlock = { entity: Entity; delay: number };
// World trait: a world being built. Blocks spawn and old ones go just ahead of their reveal cue,
// so the work spreads over the sweep instead of stalling a frame. Both lists are in cue order.
export const Construction = trait(() => ({
  pending: [] as PendingBlock[],
  doomed: [] as DoomedBlock[],
  nextPending: 0,
  nextDoomed: 0,
  elapsed: 0,
}));
