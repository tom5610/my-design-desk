import { describe, expect, it } from "vitest";

import { createStarterDesign } from "../src/demo";
import { createMoveTransaction } from "../src/commands";
import { applyTransaction, type OperationMetadata } from "../src/ops";
import { serializeDesign } from "../src/serialization";

function metadata(index: number): OperationMetadata {
  return {
    opId: `op_move_${index}`,
    sessionId: "session_test",
    clientId: "client_test",
    actorId: "actor_test",
    sequence: null,
    timestamp: "2026-07-04T04:00:00.000Z",
  };
}

describe("transform commands", () => {
  it("emits geometry update operations for nudges", () => {
    const design = createStarterDesign();
    const headline = Object.values(design.nodes).find((node) => node.name === "Hero headline");
    if (!headline || !("geometry" in headline)) {
      throw new Error("Missing headline geometry");
    }

    const transaction = createMoveTransaction(design, [headline.id], { dx: 10, dy: -5 }, metadata);
    const next = applyTransaction(design, transaction);
    const moved = next.nodes[headline.id];

    expect(transaction.operations).toHaveLength(1);
    expect(serializeDesign(next)).not.toBe(serializeDesign(design));
    expect("geometry" in moved ? moved.geometry : null).toMatchObject({
      x: headline.geometry.x + 10,
      y: headline.geometry.y - 5,
    });
  });
});
