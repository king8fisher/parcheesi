"use client";

import dynamic from 'next/dynamic';

const GameCanvasNoSSR = dynamic(() => import('../components/GameCanvas'),
  { ssr: false, loading: () => <div className="w-full h-full bg-black text-white/30 flex items-center justify-center text-2xl">Loading...</div> }
);

// const GameCanvasNoSSR = dynamic(() => Promise.resolve(GameCanvas), {
//   ssr: false,
// });

export default function Home() {
  return (
    <main className="h-dvh w-screen overflow-hidden flex flex-col bg-black">
      <div className="grow min-h-0">
        <GameCanvasNoSSR />
      </div>
    </main>
  );
}
