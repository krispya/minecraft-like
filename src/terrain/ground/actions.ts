import { createActions } from 'koota';
import { PlaneCollider } from '../../physics/traits';
import { Position } from '../../transform';
import { Ground } from './traits';

export const groundActions = createActions((world) => ({
  spawnGround: () => {
    return world.spawn(Ground, PlaneCollider, Position);
  },
}));
