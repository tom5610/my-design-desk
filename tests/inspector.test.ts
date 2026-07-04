import { describe, expect, it } from "vitest";

import { createStarterDesign } from "../src/demo";
import { applyOperation, type OperationMetadata } from "../src/ops";

function metadata(): OperationMetadata {
  return {
    opId: "op_inspector",
    sessionId: "session_test",
    clientId: "client_test",
    actorId: "actor_test",
    sequence: null,
    timestamp: "2026-07-04T07:00:00.000Z",
  };
}

describe("inspector operations", () => {
  it("updates selected node constraints through ops", () => {
    const design = createStarterDesign();
    const headline = Object.values(design.nodes).find((node) => node.name === "Hero headline");
    if (!headline) throw new Error("Missing headline");

    const next = applyOperation(design, {
      ...metadata(),
      kind: "node.updateConstraints",
      payload: {
        nodeId: headline.id,
        constraints: { horizontal: "center", vertical: "top" },
      },
    });

    expect(next.nodes[headline.id]?.constraints.horizontal).toBe("center");
  });
});
