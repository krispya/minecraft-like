import { trait } from 'koota';
import type { Object3D } from 'three/webgpu';

// Mounted objects belong to the view, separate from simulation data.
export const Ref = trait((): Object3D | null => null);
export const ColliderDebugRef = trait((): Object3D | null => null);
