import { describe, expect, it } from "vitest";

import { createStarterDesign } from "../src/demo";
import { applyTransaction, type OperationMetadata } from "../src/ops";
import { createLayerMetaTransaction, createReorderTransaction, flattenLayers } from "../src/panels/layers";

function metadata(): OperationMetadata {
  return {
    opId: "op_layer_test",
    sessionId: "session_test",
    clientId: "client_test",
    actorId: "actor_test",
    sequence: null,
    timestamp: "2026-07-04T06:00:00.000Z",
  };
}

describe("layers panel model", () => {
  it("flattens layers in visible scene order with nesting depth", () => {
    const rows = flattenLayers(createStarterDesign());

    expect(rows.map((row) => row.node.name)).toEqual(expect.arrayContaining(["AI Builder landing page", "AI Builder dashboard frame"]));
    expect(rows.some((row) => row.node.name === "Hero headline" && row.depth > 0)).toBe(true);
  });

  it("filters layers by name or kind", () => {
    const rows = flattenLayers(createStarterDesign(), "headline");

    expect(rows.map((row) => row.node.name)).toContain("Hero headline");
  });

  it("updates layer visibility through operations", () => {
    const design = createStarterDesign();
    const headline = Object.values(design.nodes).find((node) => node.name === "Hero headline");
    if (!headline) throw new Error("Missing headline");

    const next = applyTransaction(design, createLayerMetaTransaction(headline.id, { visible: false }, metadata()));
    expect(next.nodes[headline.id]?.visible).toBe(false);
  });

  it("emits reorder operations for sibling layers", () => {
    const design = createStarterDesign();
    const body = Object.values(design.nodes).find((node) => node.name === "Hero supporting copy");
    if (!body) throw new Error("Missing body");

    const transaction = createReorderTransaction(design, body.id, "up", metadata());
    expect(transaction.operations[0]?.kind).toBe("node.reorder");
  });
});
