import dynamic from 'next/dynamic';
import GameCanvas from "../components/GameCanvas";

const GameCanvasNoSSR = dynamic(() => import('../components/GameCanvas'), { ssr: false, loading: () => <div>Loading GameCanvas...</div> });

// const GameCanvasNoSSR = dynamic(() => Promise.resolve(GameCanvas), {
//   ssr: false,
// });

export default function Home() {
  return (
    <main className="h-screen w-screen flex bg-white">
      <GameCanvas />
    </main>
  );
}
