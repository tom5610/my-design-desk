import { describe, expect, it } from "vitest";

import { createStarterDesign } from "../src/demo";
import { clearSelection, selectOne, toggleSelection } from "../src/selection";

function nodeId(name: string) {
  const design = createStarterDesign();
  const node = Object.values(design.nodes).find((candidate) => candidate.name === name);
  if (!node) {
    throw new Error(`Missing node ${name}`);
  }
  return node.id;
}

describe("selection model", () => {
  it("selects one active node deterministically", () => {
    const id = nodeId("Hero headline");

    expect(selectOne(id)).toEqual({ selectedIds: [id], activeId: id });
  });

  it("toggles multi-selection while keeping a stable active node", () => {
    const headline = nodeId("Hero headline");
    const chart = nodeId("Metrics preview");
    const selected = toggleSelection(toggleSelection(selectOne(headline), chart), headline);

    expect(selected).toEqual({ selectedIds: [chart], activeId: chart });
  });

  it("clears selection", () => {
    expect(clearSelection()).toEqual({ selectedIds: [], activeId: null });
  });
});
