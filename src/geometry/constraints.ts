import type { Constraints, Geometry } from "../model";

export function applyConstraints(child: Geometry, constraints: Constraints, parentBefore: Geometry, parentAfter: Geometry): Geometry {
  const widthDelta = parentAfter.width - parentBefore.width;
  const heightDelta = parentAfter.height - parentBefore.height;
  const relativeX = child.x - parentBefore.x;
  const relativeY = child.y - parentBefore.y;

  let x = child.x;
  let y = child.y;
  let width = child.width;
  let height = child.height;

  if (constraints.horizontal === "right") {
    x += widthDelta;
  } else if (constraints.horizontal === "leftRight") {
    width += widthDelta;
  } else if (constraints.horizontal === "center") {
    x = parentAfter.x + parentAfter.width / 2 - child.width / 2;
  } else if (constraints.horizontal === "scale") {
    const scale = parentAfter.width / parentBefore.width;
    x = parentAfter.x + relativeX * scale;
    width = child.width * scale;
  }

  if (constraints.vertical === "bottom") {
    y += heightDelta;
  } else if (constraints.vertical === "topBottom") {
    height += heightDelta;
  } else if (constraints.vertical === "center") {
    y = parentAfter.y + parentAfter.height / 2 - child.height / 2;
  } else if (constraints.vertical === "scale") {
    const scale = parentAfter.height / parentBefore.height;
    y = parentAfter.y + relativeY * scale;
    height = child.height * scale;
  }

  return {
    ...child,
    x,
    y,
    width,
    height,
  };
}
