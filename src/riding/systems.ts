import type { Entity, World } from 'koota';
import { Vector3 } from 'three';
import { Camera, Follows, IsFirstPerson } from '../camera/traits';
import { Input } from '../controllers/characterController';
import { Player } from '../character/player/traits';
import { Position, Rotation } from '../transform';
import { ridingActions } from './actions';
import { Rideable, Rides } from './traits';

// The rider steers: their input drives the mount instead of themselves.
export function updateMountInput(world: World) {
  world
    .query(Rides('*'), Input)
    .select(Input)
    .updateEach(([input], rider) => {
      const mount = rider.targetFor(Rides);
      if (!mount?.has(Input)) return;

      mount.set(Input, { x: input.x, y: input.y, jump: input.jump });
    });
}

// Carries out mount requests inside the tick, after physics has settled and before riders and the
// camera are placed, so the rider and the camera move in the same frame.
export function updateMounting(world: World) {
  const { toggleMount } = ridingActions(world);
  const requests: Entity[] = [];

  world.query(Player, Input).forEach((entity) => {
    if (entity.get(Input)!.mount) requests.push(entity);
  });

  for (const entity of requests) {
    entity.set(Input, { mount: false });
    toggleMount();
  }
}

const seatOffset = new Vector3();

// Runs after physics so riders sit on wherever their mount ended up this frame.
export function updateRiders(world: World) {
  world
    .query(Rides('*'), Position, Rotation)
    .select(Position, Rotation)
    .updateEach(([position, rotation], rider) => {
      const mount = rider.targetFor(Rides);
      const mountPosition = mount?.get(Position);
      const mountRotation = mount?.get(Rotation);
      const seat = mount?.get(Rideable)?.seat;
      if (!mountPosition || !mountRotation || !seat) return;

      seatOffset.copy(seat).applyQuaternion(mountRotation);
      position.copy(mountPosition).add(seatOffset);

      // A first-person rider keeps looking around while the mount turns underneath.
      const looksAround = world.queryFirst(Camera, IsFirstPerson, Follows(rider)) !== undefined;
      if (!looksAround) rotation.copy(mountRotation);
    });
}
