import { useEffect, useEffectEvent } from 'react';

type Callback = (dt: number) => void;

export function useAnimationFrame(callback: Callback) {
  const onFrame = useEffectEvent((dt: number) => callback(dt));

  useEffect(() => {
    let lastTime = performance.now();
    let requestId = 0;

    const handleFrame = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      onFrame(dt);
      requestId = requestAnimationFrame(handleFrame);
    };

    requestId = requestAnimationFrame(handleFrame);

    return () => {
      cancelAnimationFrame(requestId);
    };
  }, []);
}
