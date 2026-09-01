import { createActions, type Entity, type TagTrait } from 'koota';
import { Quaternion, Vector3 } from 'three';
import {
  Block,
  BoxCollider,
  Camera,
  CharacterController,
  Ground,
  Input,
  IsAirborne,
  IsFirstPerson,
  IsIdle,
  IsThirdPerson,
  IsWalking,
  PlaneCollider,
  Player,
  Position,
  Rotation,
  Velocity,
} from './traits';

export const actions = createActions((world) => {
  const spawnBlockAt = (position: Vector3) => {
    const snappedPosition = position
      .clone()
      .set(Math.round(position.x), Math.round(position.y - 0.5) + 0.5, Math.round(position.z));

    const isOccupied = world
      .query(Block, Position)
      .some((block) => block.get(Position)?.equals(snappedPosition));
    if (isOccupied) return;

    const intersectsPlayer = world.query(Player, Position, BoxCollider).some((player) => {
      const playerPosition = player.get(Position)!;
      const collider = player.get(BoxCollider)!;

      return (
        Math.abs(playerPosition.x - snappedPosition.x) < (collider.size.x + 1) / 2 &&
        Math.abs(playerPosition.y - snappedPosition.y) < (collider.size.y + 1) / 2 &&
        Math.abs(playerPosition.z - snappedPosition.z) < (collider.size.z + 1) / 2
      );
    });
    if (intersectsPlayer) return;

    return world.spawn(Block, Position(snappedPosition), BoxCollider);
  };

  return {
    spawnPlayer: ({ position = [0, 0, 0], rotation = [0, 0, 0, 1] } = {}) => {
      return world.spawn(
        Player,
        CharacterController,
        IsIdle,
        Input,
        Position(new Vector3(position[0], position[1], position[2])),
        Rotation(new Quaternion(rotation[0], rotation[1], rotation[2], rotation[3])),
        Velocity,
        BoxCollider({ size: new Vector3(0.6, 2, 0.6) })
      );
    },
    transitionCharacter: (entity: Entity, state: TagTrait) => {
      if (entity.has(state)) return;

      entity.remove(IsIdle, IsWalking, IsAirborne);
      entity.add(state);
    },
    toggleCameraPerspective: () => {
      world.query(Camera).forEach((camera) => {
        const perspective = camera.has(IsFirstPerson) ? IsThirdPerson : IsFirstPerson;

        camera.remove(IsFirstPerson, IsThirdPerson);
        camera.add(perspective);
      });
    },
    spawnGround: () => {
      return world.spawn(Ground, PlaneCollider, Position);
    },
    spawnBlockAt,
    placeBlock: (surface: Entity, hit: { point: Vector3; normal: Vector3 }) => {
      if (surface.has(Block)) {
        const surfacePosition = surface.get(Position);
        if (!surfacePosition || hit.normal.lengthSq() === 0) return;

        const x = Math.abs(hit.normal.x);
        const y = Math.abs(hit.normal.y);
        const z = Math.abs(hit.normal.z);
        const offset = new Vector3();

        if (x >= y && x >= z) offset.x = Math.sign(hit.normal.x);
        else if (y >= z) offset.y = Math.sign(hit.normal.y);
        else offset.z = Math.sign(hit.normal.z);

        return spawnBlockAt(surfacePosition.clone().add(offset));
      }

      const plane = surface.get(PlaneCollider);
      if (!plane || plane.normal.lengthSq() === 0) return;

      return spawnBlockAt(hit.point.clone().addScaledVector(plane.normal.clone().normalize(), 0.5));
    },
    spawnCamera: ({ position = [0, 0, 0], rotation = [0, 0, 0, 1] } = {}) => {
      return world.spawn(
        Camera,
        Position(new Vector3(position[0], position[1], position[2])),
        Rotation(new Quaternion(rotation[0], rotation[1], rotation[2], rotation[3]))
      );
    },
  };
});
