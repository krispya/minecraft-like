import { trait } from 'koota';

// How a character moves. Speeds are units per second, and the rates are how fast the velocity
// changes toward the input while moving and toward zero while not.
export const CharacterController = trait({
  maxSpeed: 5,
  acceleration: 50,
  friction: 70,
});
// Movement input in world space. x points along +x and y along -z, each -1 to 1.
export const Input = trait({ x: 0, y: 0 });
