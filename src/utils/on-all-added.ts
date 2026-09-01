import type { Entity, Trait, World } from 'koota';

// Calls back once an entity has every one of the traits, in whatever order they were added. Trait
// add events fire after the value is stored, unlike query add events, so the callback can read all
// of them. Re-adding one of the traits later calls back again.
export function onAllAdded(world: World, traits: Trait[], callback: (entity: Entity) => void) {
  const unsubscribe = traits.map((trait) =>
    world.onAdd(trait, (entity) => {
      if (traits.every((required) => entity.has(required))) callback(entity);
    })
  );

  return () => unsubscribe.forEach((stop) => stop());
}
