import { describe, expect, it } from "vitest";

import { applyConstraints } from "../src/geometry";

describe("constraints", () => {
  it("keeps right-pinned nodes attached when parent width changes", () => {
    const child = { x: 80, y: 40, width: 100, height: 50, rotation: 0 };
    const before = { x: 0, y: 0, width: 300, height: 200, rotation: 0 };
    const after = { x: 0, y: 0, width: 360, height: 200, rotation: 0 };

    expect(applyConstraints(child, { horizontal: "right", vertical: "top" }, before, after).x).toBe(140);
  });

  it("scales geometry deterministically", () => {
    const child = { x: 50, y: 40, width: 100, height: 50, rotation: 0 };
    const before = { x: 0, y: 0, width: 200, height: 100, rotation: 0 };
    const after = { x: 0, y: 0, width: 400, height: 200, rotation: 0 };

    expect(applyConstraints(child, { horizontal: "scale", vertical: "scale" }, before, after)).toMatchObject({
      x: 100,
      y: 80,
      width: 200,
      height: 100,
    });
  });
});
