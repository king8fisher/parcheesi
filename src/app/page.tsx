import dynamic from 'next/dynamic';
import GameCanvas from "../components/GameCanvas";

const GameCanvasNoSSR = dynamic(() => import('../components/GameCanvas'),
  { ssr: false, loading: () => <div className="text-xs w-full h-full bg-black text-white/20 p-1">Loading...</div> }
);

// const GameCanvasNoSSR = dynamic(() => Promise.resolve(GameCanvas), {
//   ssr: false,
// });

export default function Home() {
  return (
    <main className="h-screen w-screen overflow-clip flex flex-col bg-transparent ">
      <div className="grow">
        <GameCanvasNoSSR key={Math.random()} />
      </div>
    </main>
  );
}
