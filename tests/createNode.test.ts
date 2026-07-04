import { describe, expect, it } from "vitest";

import { createStarterDesign } from "../src/demo";
import { applyOperation, type OperationMetadata } from "../src/ops";
import { serializeDesign } from "../src/serialization";
import { createNodeOperation, createToolIdFactory, creationTools } from "../src/tools";

function metadata(tool: string): OperationMetadata {
  return {
    opId: `op_create_${tool}`,
    sessionId: "session_test",
    clientId: "client_test",
    actorId: "actor_test",
    sequence: null,
    timestamp: "2026-07-04T05:00:00.000Z",
  };
}

describe("node creation tools", () => {
  it("creates every Milestone 9 node kind through node.create operations", () => {
    let design = createStarterDesign();
    const ids = createToolIdFactory("creation-test");

    for (const [index, tool] of creationTools.entries()) {
      const operation = createNodeOperation(tool, { x: 80 + index * 12, y: 90 + index * 10 }, design.rootIds[0] ?? null, ids, metadata(tool));
      design = applyOperation(design, operation);
      expect(design.nodes[operation.payload.node.id]?.kind).toBe(tool);
    }

    expect(serializeDesign(design)).toContain('"kind": "ChartPlaceholder"');
  });

  it("uses deterministic ids for the same creation sequence", () => {
    const first = createToolIdFactory("same-seed");
    const second = createToolIdFactory("same-seed");

    expect(createNodeOperation("Rectangle", { x: 10, y: 20 }, null, first, metadata("a")).payload.node.id).toBe(
      createNodeOperation("Rectangle", { x: 10, y: 20 }, null, second, metadata("a")).payload.node.id,
    );
  });
});
