import { describe, expect, it } from "vitest";

import { createStarterDesign } from "../src/demo";
import { hitTest, screenToDocument, documentToScreen, zoomAtPoint } from "../src/geometry";

describe("viewport coordinates", () => {
  it("round-trips screen and document coordinates", () => {
    const viewport = { x: -40, y: -80, zoom: 0.72 };
    const screen = documentToScreen({ x: 240, y: 160 }, viewport);

    const documentPoint = screenToDocument(screen, viewport);
    expect(documentPoint.x).toBeCloseTo(240);
    expect(documentPoint.y).toBeCloseTo(160);
  });

  it("keeps the zoom anchor stable", () => {
    const viewport = { x: -40, y: -80, zoom: 0.72 };
    const anchor = { x: 720, y: 480 };
    const before = screenToDocument(anchor, viewport);
    const after = screenToDocument(anchor, zoomAtPoint(viewport, anchor, 1.2));

    expect(after.x).toBeCloseTo(before.x);
    expect(after.y).toBeCloseTo(before.y);
  });
});

describe("hit testing", () => {
  it("returns the topmost visible unlocked node at a document point", () => {
    const design = createStarterDesign();

    const hit = hitTest(design, { x: 850, y: 220 });
    const node = hit ? design.nodes[hit] : null;

    expect(node?.name).toBe("Metrics preview");
  });

  it("ignores hidden nodes", () => {
    const design = createStarterDesign();

    const hit = hitTest(design, { x: 140, y: 820 });
    const node = hit ? design.nodes[hit] : null;

    expect(node?.kind).toBe("Frame");
  });
});
