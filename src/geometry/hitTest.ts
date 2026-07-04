import type { DesignFile, Geometry, NodeId, Point, SceneNode } from "../model";

type GeometryNode = Extract<SceneNode, { geometry: Geometry }>;
type ContainerNode = Extract<SceneNode, { children: readonly NodeId[] }>;

function hasGeometry(node: SceneNode): node is GeometryNode {
  return "geometry" in node;
}

function isContainerNode(node: SceneNode): node is ContainerNode {
  return "children" in node;
}

function pointInRect(point: Point, geometry: Geometry) {
  return (
    point.x >= geometry.x &&
    point.x <= geometry.x + geometry.width &&
    point.y >= geometry.y &&
    point.y <= geometry.y + geometry.height
  );
}

function pointInEllipse(point: Point, geometry: Geometry) {
  const radiusX = geometry.width / 2;
  const radiusY = geometry.height / 2;
  const centerX = geometry.x + radiusX;
  const centerY = geometry.y + radiusY;
  const normalizedX = (point.x - centerX) / radiusX;
  const normalizedY = (point.y - centerY) / radiusY;
  return normalizedX * normalizedX + normalizedY * normalizedY <= 1;
}

function distanceToSegment(point: Point, start: Point, end: Point) {
  const lengthSquared = (end.x - start.x) ** 2 + (end.y - start.y) ** 2;
  if (lengthSquared === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const t = Math.max(0, Math.min(1, ((point.x - start.x) * (end.x - start.x) + (point.y - start.y) * (end.y - start.y)) / lengthSquared));
  return Math.hypot(point.x - (start.x + t * (end.x - start.x)), point.y - (start.y + t * (end.y - start.y)));
}

function hitNodeBounds(node: SceneNode, point: Point) {
  if (node.kind === "Line") {
    return distanceToSegment(point, node.start, node.end) <= Math.max(4, node.stroke.width / 2);
  }

  if (!hasGeometry(node)) {
    return false;
  }

  if (node.kind === "Ellipse") {
    return pointInEllipse(point, node.geometry);
  }

  return pointInRect(point, node.geometry);
}

function hitNode(design: DesignFile, nodeId: NodeId, point: Point): NodeId | null {
  const node = design.nodes[nodeId];
  if (!node || !node.visible || node.locked) {
    return null;
  }

  if (isContainerNode(node)) {
    for (const childId of [...node.children].reverse()) {
      const childHit = hitNode(design, childId, point);
      if (childHit) {
        return childHit;
      }
    }
  }

  return hitNodeBounds(node, point) ? node.id : null;
}

export function hitTest(design: DesignFile, point: Point): NodeId | null {
  for (const rootId of [...design.rootIds].reverse()) {
    const hit = hitNode(design, rootId, point);
    if (hit) {
      return hit;
    }
  }

  return null;
}
