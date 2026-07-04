import type { DesignFile, Geometry, NodeId, SceneNode } from "../model";

export type SnapGuide = {
  id: string;
  kind: "grid" | "alignment" | "spacing";
  orientation: "vertical" | "horizontal";
  position: number;
  start: number;
  end: number;
  label?: string;
};

export type SnapSettings = {
  grid: boolean;
  alignment: boolean;
  spacing: boolean;
  gridSize: number;
  threshold: number;
};

export type Bounds = {
  id: NodeId;
  x: number;
  y: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
  centerX: number;
  centerY: number;
};

type GeometryNode = Extract<SceneNode, { geometry: Geometry }>;

export const defaultSnapSettings: SnapSettings = {
  grid: true,
  alignment: true,
  spacing: true,
  gridSize: 8,
  threshold: 6,
};

function hasGeometry(node: SceneNode): node is GeometryNode {
  return "geometry" in node;
}

export function boundsFromGeometry(id: NodeId, geometry: Geometry): Bounds {
  return {
    id,
    x: geometry.x,
    y: geometry.y,
    width: geometry.width,
    height: geometry.height,
    right: geometry.x + geometry.width,
    bottom: geometry.y + geometry.height,
    centerX: geometry.x + geometry.width / 2,
    centerY: geometry.y + geometry.height / 2,
  };
}

export function boundsForNodes(design: DesignFile, nodeIds: readonly NodeId[]): Bounds | null {
  const bounds = nodeIds
    .map((nodeId) => design.nodes[nodeId])
    .filter((node): node is GeometryNode => Boolean(node) && hasGeometry(node))
    .map((node) => boundsFromGeometry(node.id, node.geometry));

  if (bounds.length === 0) {
    return null;
  }

  const x = Math.min(...bounds.map((bound) => bound.x));
  const y = Math.min(...bounds.map((bound) => bound.y));
  const right = Math.max(...bounds.map((bound) => bound.right));
  const bottom = Math.max(...bounds.map((bound) => bound.bottom));

  return {
    id: bounds[0].id,
    x,
    y,
    width: right - x,
    height: bottom - y,
    right,
    bottom,
    centerX: x + (right - x) / 2,
    centerY: y + (bottom - y) / 2,
  };
}

function visiblePeerBounds(design: DesignFile, selectedIds: readonly NodeId[]) {
  const selected = new Set(selectedIds);
  return Object.values(design.nodes)
    .filter((node): node is GeometryNode => hasGeometry(node) && node.visible && !selected.has(node.id) && node.kind !== "ComponentRoot")
    .map((node) => boundsFromGeometry(node.id, node.geometry));
}

function movedBounds(bounds: Bounds, delta: { dx: number; dy: number }): Bounds {
  return {
    ...bounds,
    x: bounds.x + delta.dx,
    y: bounds.y + delta.dy,
    right: bounds.right + delta.dx,
    bottom: bounds.bottom + delta.dy,
    centerX: bounds.centerX + delta.dx,
    centerY: bounds.centerY + delta.dy,
  };
}

function gridCandidate(value: number, gridSize: number) {
  return Math.round(value / gridSize) * gridSize;
}

function closer(current: { distance: number } | null, distance: number) {
  return current === null || Math.abs(distance) < Math.abs(current.distance);
}

function alignmentSnap(
  proposed: Bounds,
  peers: readonly Bounds[],
  threshold: number,
): { dx: number; dy: number; guides: SnapGuide[] } {
  let bestX: { distance: number; guide: SnapGuide } | null = null;
  let bestY: { distance: number; guide: SnapGuide } | null = null;
  const ownX = [
    { key: "left", value: proposed.x },
    { key: "center", value: proposed.centerX },
    { key: "right", value: proposed.right },
  ];
  const ownY = [
    { key: "top", value: proposed.y },
    { key: "middle", value: proposed.centerY },
    { key: "bottom", value: proposed.bottom },
  ];

  for (const peer of peers) {
    const peerX = [
      { key: "left", value: peer.x },
      { key: "center", value: peer.centerX },
      { key: "right", value: peer.right },
    ];
    const peerY = [
      { key: "top", value: peer.y },
      { key: "middle", value: peer.centerY },
      { key: "bottom", value: peer.bottom },
    ];

    for (const source of ownX) {
      for (const target of peerX) {
        const distance = target.value - source.value;
        if (Math.abs(distance) <= threshold && closer(bestX, distance)) {
          bestX = {
            distance,
            guide: {
              id: `align-x-${peer.id}-${source.key}-${target.key}`,
              kind: "alignment",
              orientation: "vertical",
              position: target.value,
              start: Math.min(proposed.y, peer.y),
              end: Math.max(proposed.bottom, peer.bottom),
            },
          };
        }
      }
    }

    for (const source of ownY) {
      for (const target of peerY) {
        const distance = target.value - source.value;
        if (Math.abs(distance) <= threshold && closer(bestY, distance)) {
          bestY = {
            distance,
            guide: {
              id: `align-y-${peer.id}-${source.key}-${target.key}`,
              kind: "alignment",
              orientation: "horizontal",
              position: target.value,
              start: Math.min(proposed.x, peer.x),
              end: Math.max(proposed.right, peer.right),
            },
          };
        }
      }
    }
  }

  return {
    dx: bestX?.distance ?? 0,
    dy: bestY?.distance ?? 0,
    guides: [bestX?.guide, bestY?.guide].filter((guide): guide is SnapGuide => Boolean(guide)),
  };
}

function spacingSnap(
  proposed: Bounds,
  peers: readonly Bounds[],
  threshold: number,
): { dx: number; dy: number; guides: SnapGuide[] } {
  const left = peers.filter((peer) => peer.right <= proposed.x).sort((a, b) => b.right - a.right)[0];
  const right = peers.filter((peer) => peer.x >= proposed.right).sort((a, b) => a.x - b.x)[0];
  const top = peers.filter((peer) => peer.bottom <= proposed.y).sort((a, b) => b.bottom - a.bottom)[0];
  const bottom = peers.filter((peer) => peer.y >= proposed.bottom).sort((a, b) => a.y - b.y)[0];
  const guides: SnapGuide[] = [];
  let dx = 0;
  let dy = 0;

  if (left && right) {
    const desiredX = (left.right + right.x - proposed.width) / 2;
    const distance = desiredX - proposed.x;
    if (Math.abs(distance) <= threshold) {
      dx = distance;
      const gap = Math.round(desiredX - left.right);
      guides.push({
        id: `space-x-${left.id}-${right.id}`,
        kind: "spacing",
        orientation: "horizontal",
        position: proposed.centerY,
        start: left.right,
        end: right.x,
        label: `${gap}px`,
      });
    }
  }

  if (top && bottom) {
    const desiredY = (top.bottom + bottom.y - proposed.height) / 2;
    const distance = desiredY - proposed.y;
    if (Math.abs(distance) <= threshold) {
      dy = distance;
      const gap = Math.round(desiredY - top.bottom);
      guides.push({
        id: `space-y-${top.id}-${bottom.id}`,
        kind: "spacing",
        orientation: "vertical",
        position: proposed.centerX,
        start: top.bottom,
        end: bottom.y,
        label: `${gap}px`,
      });
    }
  }

  return { dx, dy, guides };
}

export function snapMove(
  design: DesignFile,
  nodeIds: readonly NodeId[],
  rawDelta: { dx: number; dy: number },
  settings: SnapSettings = defaultSnapSettings,
): { delta: { dx: number; dy: number }; guides: SnapGuide[] } {
  const selectedBounds = boundsForNodes(design, nodeIds);
  if (!selectedBounds) {
    return { delta: rawDelta, guides: [] };
  }

  const peers = visiblePeerBounds(design, nodeIds);
  let delta = rawDelta;
  let proposed = movedBounds(selectedBounds, delta);
  const guides: SnapGuide[] = [];

  if (settings.grid) {
    const gridX = gridCandidate(proposed.x, settings.gridSize);
    const gridY = gridCandidate(proposed.y, settings.gridSize);
    const gridDx = gridX - proposed.x;
    const gridDy = gridY - proposed.y;

    if (Math.abs(gridDx) <= settings.threshold) {
      delta = { ...delta, dx: delta.dx + gridDx };
      guides.push({
        id: "grid-x",
        kind: "grid",
        orientation: "vertical",
        position: gridX,
        start: proposed.y - 24,
        end: proposed.bottom + 24,
      });
    }
    if (Math.abs(gridDy) <= settings.threshold) {
      delta = { ...delta, dy: delta.dy + gridDy };
      guides.push({
        id: "grid-y",
        kind: "grid",
        orientation: "horizontal",
        position: gridY,
        start: proposed.x - 24,
        end: proposed.right + 24,
      });
    }
    proposed = movedBounds(selectedBounds, delta);
  }

  if (settings.alignment) {
    const alignment = alignmentSnap(proposed, peers, settings.threshold);
    delta = { dx: delta.dx + alignment.dx, dy: delta.dy + alignment.dy };
    guides.push(...alignment.guides);
    proposed = movedBounds(selectedBounds, delta);
  }

  if (settings.spacing) {
    const spacing = spacingSnap(proposed, peers, settings.threshold);
    delta = { dx: delta.dx + spacing.dx, dy: delta.dy + spacing.dy };
    guides.push(...spacing.guides);
  }

  return { delta, guides };
}
