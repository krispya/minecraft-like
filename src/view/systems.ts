import type { World } from 'koota';
import { Position, Rotation, Scale } from '../transform';
import { ColliderDebugRef, Ref } from './traits';

// Copy simulation transforms into mounted objects before rendering.
export function syncTransforms(world: World) {
  world.query(Position, Ref).readEach(([position, object]) => {
    object?.position.copy(position);
  });

  world.query(Rotation, Ref).readEach(([rotation, object]) => {
    object?.quaternion.copy(rotation);
  });

  world.query(Scale, Ref).readEach(([scale, object]) => {
    object?.scale.copy(scale);
  });

  // Physics boxes stay aligned to world axes and use their collider dimensions.
  world.query(Position, ColliderDebugRef).readEach(([position, object]) => {
    object?.position.copy(position);
  });
}
