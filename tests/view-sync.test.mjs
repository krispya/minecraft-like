import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createWorld } from 'koota';
import { Group, Mesh, Quaternion, Vector3 } from 'three/webgpu';
import { createServer } from 'vite';

await test('view sync', async (suite) => {
  const server = await createServer({
    configFile: false,
    appType: 'custom',
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  suite.after(() => server.close());

  const { Position, Rotation, Scale } = await server.ssrLoadModule('/src/transform.ts');
  const { Ref, ColliderDebugRef } = await server.ssrLoadModule('/src/view/traits.ts');
  const { captureRef } = await server.ssrLoadModule('/src/view/capture-ref.ts');
  const { syncTransforms } = await server.ssrLoadModule('/src/view/systems.ts');

  await suite.test('mounted views follow live transforms and preserve local model offsets', (t) => {
    const world = createWorld();
    t.after(() => world.destroy());
    const entity = world.spawn(Position(new Vector3(2, 1, -3)), Rotation, Scale);
    const group = new Group();
    const model = new Mesh();
    model.position.y = -1;
    group.add(model);

    syncTransforms(world);
    assert.equal(entity.has(Ref), false);
    captureRef(entity)(group);
    syncTransforms(world);
    assert.deepEqual(group.position.toArray(), [2, 1, -3]);

    // Direct mutations do not emit trait notifications.
    entity.get(Position).set(4, 2, 5);
    entity.get(Rotation).setFromAxisAngle(new Vector3(0, 1, 0), 1);
    entity.get(Scale).set(2, 3, 4);
    syncTransforms(world);
    assert.deepEqual(group.position.toArray(), [4, 2, 5]);
    assert.ok(group.quaternion.equals(entity.get(Rotation)));
    assert.deepEqual(group.scale.toArray(), [2, 3, 4]);
    assert.equal(model.position.y, -1);

    const ground = world.spawn(Position);
    const plane = new Mesh();
    plane.rotation.x = -Math.PI / 2;
    captureRef(ground)(plane);
    syncTransforms(world);
    assert.equal(plane.rotation.x, -Math.PI / 2);
  });

  await suite.test('replacing, hiding, and remounting a view keeps the current ref', (t) => {
    const world = createWorld();
    t.after(() => world.destroy());
    const entity = world.spawn(Position);
    const oldView = new Group();
    const newView = new Group();
    const detachOld = captureRef(entity)(oldView);
    const detachNew = captureRef(entity)(newView);
    detachOld();
    assert.equal(entity.get(Ref), newView);

    entity.get(Position).x = 7;
    syncTransforms(world);
    assert.equal(newView.position.x, 7);
    assert.equal(oldView.position.x, 0);
    detachNew();
    assert.equal(entity.has(Ref), false);
    entity.get(Position).x = 9;
    syncTransforms(world);
    assert.equal(newView.position.x, 7);

    captureRef(entity)(oldView);
    syncTransforms(world);
    assert.equal(oldView.position.x, 9);
  });

  await suite.test(
    'debug colliders follow position independently of model rotation and scale',
    (t) => {
      const world = createWorld();
      t.after(() => world.destroy());
      const entity = world.spawn(
        Position(new Vector3(4, 2, 5)),
        Rotation(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 1)),
        Scale(new Vector3(2, 3, 4))
      );
      const model = new Group();
      const collider = new Mesh();
      captureRef(entity)(model);
      const detachCollider = captureRef(entity, ColliderDebugRef)(collider);
      syncTransforms(world);
      assert.ok(collider.position.equals(model.position));
      assert.ok(model.quaternion.equals(entity.get(Rotation)));
      assert.ok(collider.quaternion.equals(new Quaternion()));
      assert.deepEqual(collider.scale.toArray(), [1, 1, 1]);

      detachCollider();
      assert.equal(entity.has(ColliderDebugRef), false);
      assert.equal(entity.get(Ref), model);
      entity.get(Position).x = 8;
      syncTransforms(world);
      assert.equal(model.position.x, 8);
      assert.equal(collider.position.x, 4);
    }
  );

  await suite.test('an entity can be destroyed before its views unmount', (t) => {
    const world = createWorld();
    t.after(() => world.destroy());
    const entity = world.spawn(Position);
    const detach = captureRef(entity)(new Group());
    const detachCollider = captureRef(entity, ColliderDebugRef)(new Mesh());
    entity.destroy();
    assert.doesNotThrow(detach);
    assert.doesNotThrow(detachCollider);
    assert.equal(captureRef(entity)(new Group()), undefined);
    assert.doesNotThrow(() => syncTransforms(world));
  });
});
