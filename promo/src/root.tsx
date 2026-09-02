import { Composition } from 'remotion';
import { totalFrames } from './beat';
import { Promo } from './promo';

// Matches the 50 fps proxy footage without frame resampling.
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
