import { describe, expect, it } from "vitest";

import { createStarterDesign } from "../src/demo";
import { createGroupTransaction, createLockTransaction, createOrderingTransaction } from "../src/commands";
import { applyTransaction, type OperationMetadata } from "../src/ops";
import type { NodeId } from "../src/model";

function metadata(index = 0): OperationMetadata {
  return {
    opId: `op_order_${index}`,
    sessionId: "session_test",
    clientId: "client_test",
    actorId: "actor_test",
    sequence: null,
    timestamp: "2026-07-04T08:00:00.000Z",
  };
}

function nodeId(name: string): NodeId {
  const design = createStarterDesign();
  const node = Object.values(design.nodes).find((candidate) => candidate.name === name);
  if (!node) throw new Error(`Missing ${name}`);
  return node.id;
}

describe("ordering and grouping commands", () => {
  it("emits reorder operations that preserve siblings", () => {
    const design = createStarterDesign();
    const body = nodeId("Hero supporting copy");
    const next = applyTransaction(design, createOrderingTransaction(design, body, "front", metadata()));

    expect(next.nodes[body]?.parentId).toBe(design.nodes[body]?.parentId);
  });

  it("emits lock operations", () => {
    const design = createStarterDesign();
    const headline = nodeId("Hero headline");
    const next = applyTransaction(design, createLockTransaction(headline, true, metadata()));

    expect(next.nodes[headline]?.locked).toBe(true);
  });

  it("groups same-parent nodes under a new group", () => {
    const design = createStarterDesign();
    const headline = nodeId("Hero headline");
    const body = nodeId("Hero supporting copy");
    const groupId = "node_group_test" as NodeId;
    const next = applyTransaction(design, createGroupTransaction(design, [headline, body], groupId, metadata));

    expect(next.nodes[groupId]?.kind).toBe("Group");
    expect(next.nodes[headline]?.parentId).toBe(groupId);
    expect(next.nodes[body]?.parentId).toBe(groupId);
  });
});
