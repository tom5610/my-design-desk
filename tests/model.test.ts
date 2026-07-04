import { describe, expect, it } from "vitest";

import { createStarterDesign } from "../src/demo/starterDesign";
import { createDeterministicIdFactory } from "../src/model/ids";
import { requiredNodeKinds } from "../src/model/scene";
import { validateDesign } from "../src/model/validation";
import { serializeDesign } from "../src/serialization/canonical";

describe("deterministic id factory", () => {
  it("creates repeatable ids for the same seed and allocation order", () => {
    const first = createDeterministicIdFactory("Demo Seed");
    const second = createDeterministicIdFactory("Demo Seed");

    expect([first.node("Hero"), first.node("Hero"), first.style("Ink")]).toEqual([
      second.node("Hero"),
      second.node("Hero"),
      second.style("Ink"),
    ]);
  });

  it("keeps counters independent by id prefix", () => {
    const ids = createDeterministicIdFactory("demo");

    expect(ids.node("primary")).toBe("node_demo_primary_0001");
    expect(ids.component("primary")).toBe("component_demo_primary_0001");
    expect(ids.node("secondary")).toBe("node_demo_secondary_0002");
  });
});

describe("scene model", () => {
  it("tracks every required prompt node kind", () => {
    expect(requiredNodeKinds).toEqual([
      "Frame",
      "Group",
      "Rectangle",
      "Ellipse",
      "Line",
      "Text",
      "Image",
      "Button",
      "Icon",
      "ChartPlaceholder",
      "ComponentRoot",
      "ComponentInstance",
    ]);
  });

  it("creates a valid starter design seed", () => {
    const design = createStarterDesign();

    expect(validateDesign(design)).toEqual({ valid: true, errors: [] });
  });
});

describe("canonical serialization", () => {
  it("serializes the same design bytes every time", () => {
    const design = createStarterDesign();

    expect(serializeDesign(design)).toBe(serializeDesign(createStarterDesign()));
  });

  it("sorts object keys and normalizes numbers", () => {
    expect(
      serializeDesign({
        ...createStarterDesign(),
        nodes: Object.fromEntries(Object.entries(createStarterDesign().nodes).reverse()),
        updatedAt: "2026-07-04T00:00:00.000Z",
      }),
    ).toContain('"rotation": 0');
  });
});
