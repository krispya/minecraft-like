import type { World } from 'koota';
import { Vector3 } from 'three';
import { Camera, Follows, IsFirstPerson, Position, Rideable, Rides, Rotation } from '../traits';

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
