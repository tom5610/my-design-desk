import { describe, expect, it } from "vitest";

import { createRestoreSnapshotTransaction, createSnapshotFromDesign, createSnapshotTransaction } from "../src/history";
import { createStarterDesign } from "../src/demo";
import { createDeterministicIdFactory, type DesignFile } from "../src/model";
import { applyTransaction, type OperationMetadata } from "../src/ops";
import { serializeDesign } from "../src/serialization";

function metadata(opId: string): OperationMetadata {
  return {
    opId,
    sessionId: "session_snapshots",
    clientId: "client_snapshots",
    actorId: "actor_snapshots",
    sequence: null,
    timestamp: "2026-07-04T10:00:00.000Z",
  };
}

function headlineId(design: DesignFile) {
  const node = Object.values(design.nodes).find((candidate) => candidate.name === "Hero headline");
  if (!node) {
    throw new Error("Missing headline");
  }
  return node.id;
}

describe("version snapshots", () => {
  it("creates deterministic diffable snapshot documents", () => {
    const design = createStarterDesign();
    const ids = createDeterministicIdFactory("snapshot-test");
    const snapshot = createSnapshotFromDesign(design, ids.snapshot("baseline"), "Baseline", "2026-07-04T10:00:00.000Z");

    expect(snapshot.document.rootIds).toEqual(design.rootIds);
    expect(JSON.stringify(snapshot.document, null, 2)).toContain("Hero headline");
    expect(createSnapshotFromDesign(createStarterDesign(), snapshot.id, "Baseline", snapshot.createdAt)).toEqual(snapshot);
  });

  it("restores a named snapshot through operations", () => {
    const design = createStarterDesign();
    const ids = createDeterministicIdFactory("snapshot-restore");
    const baselineId = ids.snapshot("baseline");
    const withSnapshot = applyTransaction(design, createSnapshotTransaction(design, baselineId, "Baseline", "2026-07-04T10:00:00.000Z", metadata("snapshot")));
    const moved = applyTransaction(withSnapshot, {
      id: "tx_move_headline",
      label: "Move headline",
      operations: [
        {
          ...metadata("move"),
          kind: "node.updateGeometry",
          payload: {
            nodeId: headlineId(withSnapshot),
            geometry: { x: 420, y: 220, width: 620, height: 156, rotation: 0 },
          },
        },
      ],
    });
    const restored = applyTransaction(
      moved,
      createRestoreSnapshotTransaction(moved, baselineId, ids.snapshot("before-restore"), "2026-07-04T10:05:00.000Z", (index) => metadata(`restore_${index}`)),
    );

    expect(serializeDesign({ ...restored, snapshots: {}, updatedAt: design.updatedAt })).toBe(serializeDesign({ ...design, snapshots: {} }));
    expect(Object.values(restored.snapshots).map((snapshot) => snapshot.name)).toContain("Before restoring Baseline");
  });
});
