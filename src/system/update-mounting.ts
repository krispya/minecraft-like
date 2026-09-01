import type { Entity, World } from 'koota';
import { actions } from '../actions';
import { Input, Player } from '../traits';

// Carries out mount requests inside the tick, after physics has settled and before riders and the
// camera are placed, so the rider and the camera move in the same frame.
export function updateMounting(world: World) {
  const { toggleMount } = actions(world);
  const requests: Entity[] = [];

  world.query(Player, Input).forEach((entity) => {
    if (entity.get(Input)!.mount) requests.push(entity);
  });

  for (const entity of requests) {
    entity.set(Input, { mount: false });
    toggleMount();
  }
}
