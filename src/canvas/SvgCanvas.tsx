import { Minus, Plus, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

import { createStarterDesign } from "../demo";
import { defaultViewport, zoomAtPoint, type Viewport } from "../geometry";
import { SvgScene } from "../render";

const canvasSize = {
  width: 1440,
  height: 960,
};

export function SvgCanvas() {
  const design = useMemo(() => createStarterDesign(), []);
  const [viewport, setViewport] = useState<Viewport>(defaultViewport);
  const viewBoxWidth = canvasSize.width / viewport.zoom;
  const viewBoxHeight = canvasSize.height / viewport.zoom;

  function zoom(multiplier: number) {
    setViewport((current) => zoomAtPoint(current, { x: canvasSize.width / 2, y: canvasSize.height / 2 }, current.zoom * multiplier));
  }

  return (
    <div className="absolute inset-0" data-testid="svg-canvas">
      <svg
        aria-label="Design canvas"
        className="size-full"
        data-testid="scene-svg"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        viewBox={`${viewport.x} ${viewport.y} ${viewBoxWidth} ${viewBoxHeight}`}
      >
        <SvgScene design={design} />
      </svg>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded border border-desk-line bg-white/95 p-1 shadow-panel">
        <button aria-label="Zoom out" className="flex size-8 items-center justify-center rounded hover:bg-slate-100" onClick={() => zoom(0.85)}>
          <Minus size={15} aria-hidden="true" />
        </button>
        <span className="w-14 text-center text-xs font-semibold">{Math.round(viewport.zoom * 100)}%</span>
        <button aria-label="Zoom in" className="flex size-8 items-center justify-center rounded hover:bg-slate-100" onClick={() => zoom(1.18)}>
          <Plus size={15} aria-hidden="true" />
        </button>
        <button aria-label="Reset zoom" className="flex size-8 items-center justify-center rounded hover:bg-slate-100" onClick={() => setViewport(defaultViewport)}>
          <RotateCcw size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
