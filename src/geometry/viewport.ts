import type { Point } from "../model";

export type Viewport = {
  x: number;
  y: number;
  zoom: number;
};

export const defaultViewport: Viewport = {
  x: -40,
  y: -80,
  zoom: 0.72,
};

export function screenToDocument(point: Point, viewport: Viewport): Point {
  return {
    x: point.x / viewport.zoom + viewport.x,
    y: point.y / viewport.zoom + viewport.y,
  };
}

export function documentToScreen(point: Point, viewport: Viewport): Point {
  return {
    x: (point.x - viewport.x) * viewport.zoom,
    y: (point.y - viewport.y) * viewport.zoom,
  };
}

export function clampZoom(zoom: number) {
  return Math.min(3, Math.max(0.2, zoom));
}

export function zoomAtPoint(viewport: Viewport, screenPoint: Point, nextZoom: number): Viewport {
  const documentPoint = screenToDocument(screenPoint, viewport);
  const zoom = clampZoom(nextZoom);

  return {
    zoom,
    x: documentPoint.x - screenPoint.x / zoom,
    y: documentPoint.y - screenPoint.y / zoom,
  };
}
