import { Composition } from 'remotion';
import { totalFrames } from './beat';
import { Promo } from './promo';

// 50 fps matches the source so every composition frame maps to exactly one
// video frame and the footage never resamples.
export function Root() {
  return (
    <Composition
      id="Promo"
      component={Promo}
      width={1920}
      height={1080}
      fps={50}
      durationInFrames={totalFrames(50)}
    />
  );
}
