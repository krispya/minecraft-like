import { Canvas } from '@react-three/fiber/webgpu';

// Your game. Follow the lessons in src/steps and build it up here.
export function App() {
  return (
    <>
      <Canvas />
      <p
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          margin: 0,
          color: '#666',
        }}
      >
        Your game. Start with lesson 1 in src/steps and build it up here.
      </p>
    </>
  );
}
