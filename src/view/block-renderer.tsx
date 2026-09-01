import { type ThreeEvent, useFrame } from '@react-three/fiber';
import type { Entity } from 'koota';
import { useActions, useWorld } from 'koota/react';
import { useEffect, useMemo } from 'react';
import { actions } from '../actions';
import { Mining, Player } from '../traits';
import { BlockBatch } from './block-batch';
import { useBlockTextures } from './block-materials';

type BlockEvent<T> = ThreeEvent<T> & { block?: Entity };

export function BlockRenderer() {
  const world = useWorld();
  const textures = useBlockTextures();
  const batch = useMemo(() => new BlockBatch(textures), [textures]);
  const { interactWith, stopMining } = useActions(actions);

  useEffect(() => batch.subscribe(world), [batch, world]);
  useFrame(() => batch.animate(world));

  const handlePointerDown = (event: BlockEvent<PointerEvent>) => {
    if (event.button !== 0 || !event.block || !event.face) return;

    event.stopPropagation();
    interactWith(event.block, { point: event.point, normal: event.face.normal });
  };

  // All blocks are one object to the pointer, so moving onto another block ends the swing loop
  // the same way leaving a block's own mesh used to.
  const handleMove = (event: BlockEvent<PointerEvent>) => {
    const mined = world.queryFirst(Player)?.targetFor(Mining);
    if (mined !== undefined && mined !== event.block) stopMining();
  };

  return (
    <primitive
      object={batch.group}
      onPointerDown={handlePointerDown}
      onPointerMove={handleMove}
      onPointerLeave={stopMining}
    />
  );
}
