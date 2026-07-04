import { describe, expect, it } from "vitest";

import { createStarterDesign } from "../src/demo";
import { snapMove, type SnapSettings } from "../src/geometry";
import type { DesignFile, Geometry, SceneNode } from "../src/model";

const noGrid: SnapSettings = {
  grid: false,
  alignment: true,
  spacing: false,
  gridSize: 8,
  threshold: 6,
};

const gridOnly: SnapSettings = {
  grid: true,
  alignment: false,
  spacing: false,
  gridSize: 8,
  threshold: 6,
};

function nodeByName(design: DesignFile, name: string): SceneNode {
  const node = Object.values(design.nodes).find((candidate) => candidate.name === name);
  if (!node) {
    throw new Error(`Missing node ${name}`);
  }
  return node;
}

function withGeometry(node: SceneNode, geometry: Geometry): SceneNode {
  if (!("geometry" in node)) {
    throw new Error(`Node ${node.id} has no geometry`);
  }
  return { ...node, geometry };
}

describe("snapping geometry", () => {
  it("snaps movement to the grid within the snap threshold", () => {
    const design = createStarterDesign();
    const headline = nodeByName(design, "Hero headline");

    expect(snapMove(design, [headline.id], { dx: 3, dy: 3 }, gridOnly).delta).toEqual({ dx: 0, dy: 0 });
    expect(snapMove(design, [headline.id], { dx: 3, dy: 3 }, gridOnly).guides.map((guide) => guide.kind)).toContain("grid");
  });

  it("aligns moved bounds to nearby peer edges", () => {
    const design = createStarterDesign();
    const body = nodeByName(design, "Hero supporting copy");

    const snapped = snapMove(design, [body.id], { dx: -8, dy: 0 }, noGrid);

    expect(snapped.delta.dx).toBe(-4);
    expect(snapped.guides).toContainEqual(expect.objectContaining({ kind: "alignment", orientation: "vertical", position: 160 }));
  });

  it("detects equal spacing between neighboring nodes", () => {
    const design = createStarterDesign();
    const left = nodeByName(design, "Start editing button");
    const middle = nodeByName(design, "Secondary CTA instance");
    const right = nodeByName(design, "Spark icon");
    const arranged: DesignFile = {
      ...design,
      nodes: {
        ...design.nodes,
        [left.id]: withGeometry(left, { x: 0, y: 0, width: 100, height: 40, rotation: 0 }),
        [middle.id]: withGeometry(middle, { x: 130, y: 0, width: 50, height: 40, rotation: 0 }),
        [right.id]: withGeometry(right, { x: 210, y: 0, width: 100, height: 40, rotation: 0 }),
      },
    };

    const snapped = snapMove(
      arranged,
      [middle.id],
      { dx: 5, dy: 0 },
      { grid: false, alignment: false, spacing: true, gridSize: 8, threshold: 6 },
    );

    expect(snapped.delta.dx).toBe(0);
    expect(snapped.guides).toContainEqual(expect.objectContaining({ kind: "spacing", label: "30px" }));
  });
});
