import type { DesignFile, Geometry, NodeId, SceneNode } from "../model";
import { createTransaction, type DesignOperation, type OperationMetadata, type Transaction } from "../ops";

type GeometryNode = Extract<SceneNode, { geometry: Geometry }>;

function hasGeometry(node: SceneNode): node is GeometryNode {
  return "geometry" in node;
}

export function createMoveTransaction(
  design: DesignFile,
  nodeIds: readonly NodeId[],
  delta: { dx: number; dy: number },
  metadata: (index: number) => OperationMetadata,
): Transaction {
  const operations: DesignOperation[] = [];

  nodeIds.forEach((nodeId, index) => {
    const node = design.nodes[nodeId];
    if (!node || !hasGeometry(node)) {
      return;
    }

    operations.push({
      ...metadata(index),
      kind: "node.updateGeometry",
      payload: {
        nodeId,
        geometry: {
          ...node.geometry,
          x: node.geometry.x + delta.dx,
          y: node.geometry.y + delta.dy,
        },
      },
    });
  });

  return createTransaction(`tx_move_${metadata(0).opId}`, "Move selection", operations);
}
