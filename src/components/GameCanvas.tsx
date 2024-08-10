"use client";

import { loadParcheesiGame } from "@/app/main";
import { useOnce } from "@/hooks/useOnce";
import { utils } from "@pixi/core";
import { Application, Assets, Sprite } from "pixi.js";
import { useEffect, useMemo, useRef, useState } from "react";

const app = new Application();

const GameCanvas = () => {
  const ref = useRef<HTMLDivElement>(null);

  const once = useOnce();

  const canvas = useRef<{ el: HTMLCanvasElement | null; }>({ el: null });

  useEffect(() => {
    once(() => {
      (async () => {
        await app.init({ resizeTo: window });
        // if (!canvas.current.el) {
        //   console.log('canvas has already been added');
        //   return;
        // }
        // if (ref.current?.children.length || 0 > 0) return;
        ref.current?.appendChild(app.canvas);
        canvas.current.el = app.canvas;

        // await loadPixiGameExample(app);
        await loadParcheesiGame(app);
      })();
    });
  }, []);

  useEffect(() => {
    return () => {
      if (canvas.current && canvas.current.el) {
        canvas.current.el.remove();
        canvas.current.el = null;
      };
    };
  }, []);

  return (
    <div ref={ref} className="w-full h-full">
    </div>
  );
};

export default GameCanvas;

async function loadPixiGameExample(app: Application) {
  const img = '/images/Cog.png';
  await Assets.load(img);
  let sprite = Sprite.from(img);
  app.stage.addChild(sprite);
  // Add a variable to count up the seconds our demo has been running
  let elapsed = 0.0;
  // Tell our application's ticker to run a new callback every frame, passing
  // in the amount of time that has passed since the last tick
  app.ticker.add((ticker) => {
    // Add the time to our total elapsed time
    elapsed += ticker.deltaTime;
    // Update the sprite's X position based on the cosine of our elapsed time.  We divide
    // by 50 to slow the animation down a bit...
    sprite.x = 100.0 + Math.cos(elapsed / 50.0) * 100.0;
  });
}
