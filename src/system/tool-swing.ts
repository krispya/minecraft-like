import type { World } from 'koota';
import { actions } from '../actions';
import { Mining, Pointer, Position, Time, ToolSwing } from '../traits';

const PRIMARY_BUTTON = 1;

// The primary button swings on press, like Minecraft's attack key, and lets go of any mined block
// on release.
export function subscribeToolSwing(world: World) {
  const { swingTool, stopMining } = actions(world);
  let heldButtons = 0;

  return world.onChange(Pointer, () => {
    const { buttons } = world.get(Pointer)!;
    const pressedButtons = buttons & ~heldButtons;
    const releasedButtons = heldButtons & ~buttons;
    heldButtons = buttons;

    if (pressedButtons & PRIMARY_BUTTON) swingTool();
    if (releasedButtons & PRIMARY_BUTTON) stopMining();
  });
}

export function updateToolSwing(world: World) {
  const { delta } = world.get(Time)!;
  const { mineBlock } = actions(world);

  world.query(ToolSwing).updateEach(([swing]) => {
    swing.elapsed += delta;
  });

  world.query(ToolSwing).forEach((entity) => {
    const { elapsed, duration } = entity.get(ToolSwing)!;
    if (elapsed < duration) return;

    entity.remove(ToolSwing);

    // Minecraft's mining loop: while holding on a block, swing back to back with one hit per swing.
    const block = entity.targetFor(Mining);
    const blockPosition = block?.get(Position);
    if (!block || !blockPosition) return;

    mineBlock(block, blockPosition);
    if (world.has(block)) entity.add(ToolSwing({ elapsed: elapsed - duration }));
  });
}
