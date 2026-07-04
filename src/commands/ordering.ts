import { defaultConstraints, type DesignFile, type NodeId, type SceneNode } from "../model";
import { createTransaction, type DesignOperation, type OperationMetadata, type Transaction } from "../ops";

function isContainer(node: SceneNode): node is Extract<SceneNode, { children: readonly NodeId[] }> {
  return "children" in node;
}

function siblingsFor(design: DesignFile, nodeId: NodeId) {
  const node = design.nodes[nodeId];
  if (!node) return { parentId: null, siblings: [] as readonly NodeId[] };
  if (node.parentId === null) return { parentId: null, siblings: design.rootIds };
  const parent = design.nodes[node.parentId];
  return { parentId: node.parentId, siblings: parent && isContainer(parent) ? parent.children : [] };
}

export function createOrderingTransaction(design: DesignFile, nodeId: NodeId, action: "forward" | "backward" | "front" | "back", metadata: OperationMetadata): Transaction {
  const { parentId, siblings } = siblingsFor(design, nodeId);
  const index = siblings.indexOf(nodeId);
  if (index < 0) return createTransaction("tx_order_empty", "Order layer", []);

  const orderedIds = siblings.filter((id) => id !== nodeId);
  const nextIndex =
    action === "front" ? orderedIds.length : action === "back" ? 0 : action === "forward" ? Math.min(index + 1, orderedIds.length) : Math.max(index - 1, 0);
  orderedIds.splice(nextIndex, 0, nodeId);

  return createTransaction("tx_order_layer", "Order layer", [
    {
      ...metadata,
      kind: "node.reorder",
      payload: { parentId, orderedIds },
    },
  ]);
}

export function createLockTransaction(nodeId: NodeId, locked: boolean, metadata: OperationMetadata): Transaction {
  return createTransaction("tx_lock_layer", "Lock layer", [
    {
      ...metadata,
      kind: "node.updateMeta",
      payload: { nodeId, locked },
    },
  ]);
}

export function createGroupTransaction(design: DesignFile, nodeIds: readonly NodeId[], groupId: NodeId, metadata: (index: number) => OperationMetadata): Transaction {
  const nodes = nodeIds.map((id) => design.nodes[id]).filter((node): node is SceneNode => Boolean(node));
  const first = nodes[0];
  if (!first || !nodes.every((node) => node.parentId === first.parentId && "geometry" in node)) {
    return createTransaction("tx_group_empty", "Group selection", []);
  }

  const geometryNodes = nodes as Extract<SceneNode, { geometry: { x: number; y: number; width: number; height: number; rotation: number } }>[];
  const minX = Math.min(...geometryNodes.map((node) => node.geometry.x));
  const minY = Math.min(...geometryNodes.map((node) => node.geometry.y));
  const maxX = Math.max(...geometryNodes.map((node) => node.geometry.x + node.geometry.width));
  const maxY = Math.max(...geometryNodes.map((node) => node.geometry.y + node.geometry.height));
  const operations: DesignOperation[] = [
    {
      ...metadata(0),
      kind: "node.create",
      payload: {
        node: {
          id: groupId,
          kind: "Group",
          name: "Group",
          parentId: first.parentId,
          locked: false,
          visible: true,
          geometry: { x: minX, y: minY, width: maxX - minX, height: maxY - minY, rotation: 0 },
          constraints: defaultConstraints,
          children: [],
        },
      },
    },
    ...nodeIds.map((nodeId, index) => ({
      ...metadata(index + 1),
      kind: "node.reparent" as const,
      payload: { nodeId, parentId: groupId },
    })),
  ];

  return createTransaction("tx_group_selection", "Group selection", operations);
}
