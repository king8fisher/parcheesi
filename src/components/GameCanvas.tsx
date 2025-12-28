"use client";

import { backgroundBoxColor } from "@/app/constants";
import { loadParcheesiGame } from "@/app/main";
import { useOnce } from "@/hooks/useOnce";
import { settings } from "@pixi/core";
import Color from "color";
import { Application, Assets, Sprite } from "pixi.js";
import { useEffect, useRef } from "react";



const GameCanvas = () => {
  const ref = useRef<HTMLDivElement>(null);

  const once = useOnce();

  const canvas = useRef<{ el: HTMLCanvasElement | null; }>({ el: null });

  useEffect(() => {
    once(() => {

      (async () => {
        if (!ref.current) return;
        const app = new Application();

        await app.init({
          hello: true,
          resizeTo: ref.current,
          antialias: true,
          resolution: window.devicePixelRatio,
          autoDensity: false,
          backgroundColor: 0,
        });

        ref.current?.appendChild(app.canvas);
        canvas.current.el = app.canvas;

        // await loadPixiGameExample(app);
        await loadParcheesiGame(app);
      })();
    });
  }, [once]);

  useEffect(() => {
    const canvasRef = canvas.current;
    return () => {
      if (canvasRef && canvasRef.el) {
        canvasRef.el.remove();
        canvasRef.el = null;
      }
    };
  }, []);

  return (
    <div ref={ref} className="flex w-full h-full">
    </div>
  );
};

export default GameCanvas;
