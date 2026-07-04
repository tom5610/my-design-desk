import type { DesignFile, NodeId, SceneNode } from "../../model";
import { createTransaction, type DesignOperation, type OperationMetadata, type Transaction } from "../../ops";

export type LayerRow = {
  node: SceneNode;
  depth: number;
};

function isContainer(node: SceneNode): node is Extract<SceneNode, { children: readonly NodeId[] }> {
  return "children" in node;
}

export function flattenLayers(design: DesignFile, filter = ""): LayerRow[] {
  const query = filter.trim().toLowerCase();
  const rows: LayerRow[] = [];

  function visit(nodeId: NodeId, depth: number) {
    const node = design.nodes[nodeId];
    if (!node) {
      return;
    }

    const childRowsBefore = rows.length;
    if (isContainer(node)) {
      for (const childId of [...node.children].reverse()) {
        visit(childId, depth + 1);
      }
    }

    const matches = query.length === 0 || node.name.toLowerCase().includes(query) || node.kind.toLowerCase().includes(query);
    const descendantsMatched = rows.length > childRowsBefore;
    if (matches || descendantsMatched) {
      rows.splice(childRowsBefore, 0, { node, depth });
    }
  }

  for (const rootId of [...design.rootIds].reverse()) {
    visit(rootId, 0);
  }

  return rows;
}

export function createLayerMetaTransaction(
  nodeId: NodeId,
  updates: { name?: string; locked?: boolean; visible?: boolean },
  metadata: OperationMetadata,
): Transaction {
  return createTransaction("tx_update_layer_meta", "Update layer metadata", [
    {
      ...metadata,
      kind: "node.updateMeta",
      payload: {
        nodeId,
        ...updates,
      },
    },
  ]);
}

export function createReorderTransaction(design: DesignFile, nodeId: NodeId, direction: "up" | "down", metadata: OperationMetadata): Transaction {
  const node = design.nodes[nodeId];
  if (!node) {
    return createTransaction("tx_reorder_empty", "Reorder layer", []);
  }

  let siblings: readonly NodeId[];
  if (node.parentId === null) {
    siblings = design.rootIds;
  } else {
    const parent = design.nodes[node.parentId];
    siblings = parent && isContainer(parent) ? parent.children : [];
  }
  const index = siblings.indexOf(nodeId);
  const nextIndex = direction === "up" ? index + 1 : index - 1;
  if (index < 0 || nextIndex < 0 || nextIndex >= siblings.length) {
    return createTransaction("tx_reorder_empty", "Reorder layer", []);
  }

  const orderedIds = [...siblings];
  [orderedIds[index], orderedIds[nextIndex]] = [orderedIds[nextIndex], orderedIds[index]];
  const operations: DesignOperation[] = [
    {
      ...metadata,
      kind: "node.reorder",
      payload: {
        parentId: node.parentId,
        orderedIds,
      },
    },
  ];

  return createTransaction("tx_reorder_layer", "Reorder layer", operations);
}
