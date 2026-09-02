import { Composition } from 'remotion';
import { totalFrames } from './beat';
import { Promo } from './promo';

// 50 fps matches the source so every composition frame maps to exactly one
// video frame and the footage never resamples.
export function Root() {
  return (
    <>
      <Composition
        id="Promo"
        component={Promo}
        width={1920}
        height={1080}
        fps={50}
        durationInFrames={totalFrames(50)}
        defaultProps={{ format: 'landscape' as const }}
      />
      <Composition
        id="PromoVertical"
        component={Promo}
        width={1080}
        height={1920}
        fps={50}
        durationInFrames={totalFrames(50)}
        defaultProps={{ format: 'vertical' as const }}
      />
    </>
  );
}
