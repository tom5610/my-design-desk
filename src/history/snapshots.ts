import type { DesignFile, Snapshot, SnapshotId } from "../model";
import { createTransaction, type OperationMetadata, type Transaction } from "../ops";

export function createSnapshotFromDesign(design: DesignFile, id: SnapshotId, name: string, createdAt: string): Snapshot {
  return {
    id,
    name,
    createdAt,
    rootIds: design.rootIds,
    document: {
      rootIds: design.rootIds,
      nodes: design.nodes,
      components: design.components,
      comments: design.comments,
      prototypeLinks: design.prototypeLinks,
      styles: design.styles,
    },
  };
}

export function createSnapshotTransaction(design: DesignFile, id: SnapshotId, name: string, createdAt: string, metadata: OperationMetadata): Transaction {
  return createTransaction("tx_create_snapshot", "Create snapshot", [
    {
      ...metadata,
      kind: "snapshot.create",
      payload: {
        snapshot: createSnapshotFromDesign(design, id, name, createdAt),
      },
    },
  ]);
}

export function createRestoreSnapshotTransaction(
  design: DesignFile,
  snapshotId: SnapshotId,
  beforeSnapshotId: SnapshotId,
  createdAt: string,
  metadata: (index: number) => OperationMetadata,
): Transaction {
  const snapshot = design.snapshots[snapshotId];
  if (!snapshot) {
    return createTransaction("tx_restore_snapshot_empty", "Restore snapshot", []);
  }

  return createTransaction("tx_restore_snapshot", "Restore snapshot", [
    {
      ...metadata(0),
      kind: "snapshot.create",
      payload: {
        snapshot: createSnapshotFromDesign(design, beforeSnapshotId, `Before restoring ${snapshot.name}`, createdAt),
      },
    },
    {
      ...metadata(1),
      kind: "snapshot.restore",
      payload: {
        snapshotId,
      },
    },
  ]);
}
