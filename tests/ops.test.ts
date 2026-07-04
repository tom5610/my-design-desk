import { describe, expect, it } from "vitest";

import { createStarterDesign } from "../src/demo";
import { createDeterministicIdFactory, defaultConstraints, defaultNodeStyle, type DesignFile, type NodeId } from "../src/model";
import { applyOperations, createTransaction, type DesignOperation, type NodeCreateOperation, type OperationMetadata } from "../src/ops";
import { commitTransaction, createHistoryState, redo, undo } from "../src/store";
import { serializeDesign } from "../src/serialization";

function metadata(opId: string): OperationMetadata {
  return {
    opId,
    sessionId: "session_test",
    clientId: "client_test",
    actorId: "actor_test",
    sequence: null,
    timestamp: "2026-07-04T01:00:00.000Z",
  };
}

function firstNodeId(design: DesignFile, name: string) {
  const entry = Object.values(design.nodes).find((node) => node.name === name);
  if (!entry) {
    throw new Error(`Missing node ${name}`);
  }
  return entry.id;
}

function createRectangleOperation(parentId: NodeId): NodeCreateOperation {
  const ids = createDeterministicIdFactory("ops-test");
  const nodeId = ids.node("new-card");

  return {
    ...metadata("op_create_card"),
    kind: "node.create",
    payload: {
      node: {
        id: nodeId,
        kind: "Rectangle",
        name: "New card",
        parentId,
        locked: false,
        visible: true,
        geometry: { x: 240, y: 240, width: 180, height: 120, rotation: 0 },
        constraints: defaultConstraints,
        style: defaultNodeStyle,
      },
    },
  };
}

describe("deterministic ops engine", () => {
  it("replays the same ops to the same canonical design", () => {
    const initial = createStarterDesign();
    const frameId = firstNodeId(initial, "AI Builder landing page");
    const headlineId = firstNodeId(initial, "Hero headline");
    const operations: DesignOperation[] = [
      createRectangleOperation(frameId),
      {
        ...metadata("op_move_headline"),
        kind: "node.updateGeometry",
        payload: {
          nodeId: headlineId,
          geometry: { x: 180, y: 188, width: 620, height: 156, rotation: 0 },
        },
      },
    ];

    expect(serializeDesign(applyOperations(initial, operations))).toBe(
      serializeDesign(applyOperations(createStarterDesign(), operations)),
    );
  });

  it("undoes and redoes a geometry transaction", () => {
    const initial = createStarterDesign();
    const headlineId = firstNodeId(initial, "Hero headline");
    const transaction = createTransaction("tx_move_headline", "Move headline", [
      {
        ...metadata("op_move_headline"),
        kind: "node.updateGeometry",
        payload: {
          nodeId: headlineId,
          geometry: { x: 180, y: 188, width: 620, height: 156, rotation: 0 },
        },
      },
    ]);

    const committed = commitTransaction(createHistoryState(initial), transaction);
    const undone = undo(committed);
    const redone = redo(undone);

    expect(serializeDesign(undone.present)).toBe(serializeDesign(initial));
    expect(serializeDesign(redone.present)).toBe(serializeDesign(committed.present));
  });

  it("treats compound transactions as one undo step", () => {
    const initial = createStarterDesign();
    const frameId = firstNodeId(initial, "AI Builder landing page");
    const created = createRectangleOperation(frameId);
    const nodeId = created.payload.node.id;
    const transaction = createTransaction("tx_create_and_move", "Create and move card", [
      created,
      {
        ...metadata("op_move_card"),
        kind: "node.updateGeometry",
        payload: {
          nodeId,
          geometry: { x: 320, y: 260, width: 180, height: 120, rotation: 0 },
        },
      },
    ]);

    const committed = commitTransaction(createHistoryState(initial), transaction);
    const undone = undo(committed);

    expect(committed.past).toHaveLength(1);
    expect(undone.present.nodes[nodeId]).toBeUndefined();
    expect(serializeDesign(undone.present)).toBe(serializeDesign(initial));
  });
});
