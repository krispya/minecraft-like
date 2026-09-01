import { useTexture } from '@react-three/drei';
import {
  CanvasTexture,
  DoubleSide,
  type Material,
  MeshStandardMaterial,
  NearestFilter,
  SRGBColorSpace,
  type Texture,
} from 'three';
import leavesImg from '../assets/blocks/leaves.png';
import logSideImg from '../assets/blocks/log_side.png';
import logTopImg from '../assets/blocks/log_top.png';
import sandImg from '../assets/blocks/sand.png';
import snowImg from '../assets/blocks/snow_top.png';
import stoneImg from '../assets/blocks/stone.png';
import waterImg from '../assets/blocks/water.png';
import dirtImg from '../assets/dirt.jpg';
import grassImg from '../assets/grass.jpg';
import type { BlockKindName } from '../traits';

const TEXTURE_URLS = {
  grassTop: grassImg,
  dirt: dirtImg,
  stone: stoneImg,
  sand: sandImg,
  logSide: logSideImg,
  logTop: logTopImg,
  leaves: leavesImg,
  water: waterImg,
  snow: snowImg,
};

type TextureName = keyof typeof TEXTURE_URLS;
export type BlockTextures = Record<TextureName | 'grassSide', Texture>;

// Every source is 16x16 pixel art, some of it upscaled.
const FACE_PIXELS = 16;
// How many grass rows hang down each column of the side face, a jagged fringe like Minecraft's.
const GRASS_FRINGE = [3, 4, 3, 3, 4, 2, 3, 4, 3, 3, 4, 3, 2, 3, 4, 3];

// Other views mutate the shared loader textures (the ground tiles its grass), so blocks use their
// own copies. Keyed by the loader's grass texture so the set is built once.
const textureSets = new WeakMap<Texture, BlockTextures>();
// One material per kind, shared by every block of that kind.
const materials = new Map<BlockKindName, Material | Material[]>();

function pixelate(texture: Texture) {
  texture.magFilter = NearestFilter;
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

// Dirt with a fringe of grass along the top edge.
function createGrassSide(grassTop: Texture, dirt: Texture) {
  const grassImage = grassTop.image as HTMLImageElement;
  const dirtImage = dirt.image as HTMLImageElement;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = FACE_PIXELS;
  const context = canvas.getContext('2d')!;
  context.drawImage(dirtImage, 0, 0, FACE_PIXELS, FACE_PIXELS);

  const columnWidth = grassImage.width / FACE_PIXELS;
  const rowHeight = grassImage.height / FACE_PIXELS;
  GRASS_FRINGE.forEach((rows, column) => {
    const sourceX = column * columnWidth;
    context.drawImage(grassImage, sourceX, 0, columnWidth, rows * rowHeight, column, 0, 1, rows);
  });

  return pixelate(new CanvasTexture(canvas));
}

export function useBlockTextures(): BlockTextures {
  const loaded = useTexture(TEXTURE_URLS);

  let textures = textureSets.get(loaded.grassTop);
  if (!textures) {
    const copies = Object.fromEntries(
      (Object.keys(loaded) as TextureName[]).map((name) => [name, pixelate(loaded[name].clone())])
    ) as Record<TextureName, Texture>;

    textures = { ...copies, grassSide: createGrassSide(copies.grassTop, copies.dirt) };
    textureSets.set(loaded.grassTop, textures);
  }

  return textures;
}

// Box face order: +x, -x, +y, -y, +z, -z. Damage darkening comes from per-instance color.
function createMaterial(kind: BlockKindName, textures: BlockTextures): Material | Material[] {
  const standard = (
    map: Texture,
    extra: ConstructorParameters<typeof MeshStandardMaterial>[0] = {}
  ) => new MeshStandardMaterial({ map, ...extra });

  switch (kind) {
    case 'grass': {
      const side = standard(textures.grassSide);
      return [side, side, standard(textures.grassTop), standard(textures.dirt), side, side];
    }
    case 'log': {
      const side = standard(textures.logSide);
      const end = standard(textures.logTop);
      return [side, side, end, end, side, side];
    }
    case 'leaves':
      return standard(textures.leaves, { alphaTest: 0.5, side: DoubleSide });
    case 'water':
      return standard(textures.water, { transparent: true, opacity: 0.7, depthWrite: false });
    case 'dirt':
    case 'stone':
    case 'sand':
    case 'snow':
      return standard(textures[kind]);
  }
}

export function getBlockMaterial(kind: BlockKindName, textures: BlockTextures) {
  let material = materials.get(kind);
  if (!material) {
    material = createMaterial(kind, textures);
    materials.set(kind, material);
  }
  return material;
}
