import { relation, trait } from 'koota';
import { Spherical, Vector3 } from 'three';

export const Camera = trait();
// Camera to the entity it keeps in view. Exclusive, so a camera follows one thing at a time.
export const Follows = relation({ exclusive: true });

export const OrbitController = trait({
  // Where the camera sits relative to the target: how far away, how far down from straight up,
  // and how far around.
  spherical: () => new Spherical(4, Math.PI / 2.4, 0),
  target: () => new Vector3(),
  minDistance: 2,
  maxDistance: 8,
});
