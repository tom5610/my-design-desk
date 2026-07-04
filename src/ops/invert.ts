import type { DesignFile, Geometry, NodeId, SceneNode } from "../model";
import type { NodeStyle } from "../model/styles";
import type { DesignOperation, NodeReorderOperation, Transaction } from "./types";
import { applyOperation } from "./apply";

type SceneContainerNode = Extract<SceneNode, { children: readonly NodeId[] }>;
type GeometryNode = Extract<SceneNode, { geometry: Geometry }>;
type StyledNode = Extract<SceneNode, { style: NodeStyle }>;

function isContainerNode(node: SceneNode): node is SceneContainerNode {
  return "children" in node;
}

function hasGeometry(node: SceneNode): node is GeometryNode {
  return "geometry" in node;
}

function hasStyle(node: SceneNode): node is StyledNode {
  return "style" in node;
}

function inverseMetadata(operation: DesignOperation, timestamp: string) {
  return {
    opId: `${operation.opId}:inverse`,
    sessionId: operation.sessionId,
    clientId: operation.clientId,
    actorId: operation.actorId,
    sequence: null,
    timestamp,
  };
}

function collectSubtreeIds(nodes: Record<NodeId, SceneNode>, nodeId: NodeId): NodeId[] {
  const node = nodes[nodeId];
  if (!node) {
    throw new Error(`Cannot find node ${nodeId}`);
  }

  if (!isContainerNode(node)) {
    return [nodeId];
  }

  return [nodeId, ...node.children.flatMap((childId) => collectSubtreeIds(nodes, childId))];
}

function containerChildrenSnapshot(design: DesignFile) {
  return Object.fromEntries(
    (Object.entries(design.nodes) as [NodeId, SceneNode][])
      .filter(([, node]) => isContainerNode(node))
      .map(([nodeId, node]) => [nodeId, (node as SceneContainerNode).children]),
  ) as Record<NodeId, readonly NodeId[]>;
}

function indexInParent(design: DesignFile, node: SceneNode) {
  if (node.parentId === null) {
    return design.rootIds.indexOf(node.id);
  }

  const parent = design.nodes[node.parentId];
  if (!parent || !isContainerNode(parent)) {
    throw new Error(`Node ${node.id} has invalid parent ${node.parentId}`);
  }

  return parent.children.indexOf(node.id);
}

function currentOrder(design: DesignFile, operation: NodeReorderOperation) {
  if (operation.payload.parentId === null) {
    return design.rootIds;
  }

  const parent = design.nodes[operation.payload.parentId];
  if (!parent || !isContainerNode(parent)) {
    throw new Error(`Cannot invert reorder for missing or non-container parent ${operation.payload.parentId}`);
  }

  return parent.children;
}

export function invertOperation(designBefore: DesignFile, operation: DesignOperation): DesignOperation {
  switch (operation.kind) {
    case "node.create":
      return {
        ...inverseMetadata(operation, designBefore.updatedAt),
        kind: "node.delete",
        payload: { nodeId: operation.payload.node.id },
      };
    case "node.updateGeometry": {
      const node = designBefore.nodes[operation.payload.nodeId];
      if (!node || !hasGeometry(node)) {
        throw new Error(`Cannot invert geometry update for missing node ${operation.payload.nodeId}`);
      }
      return {
        ...inverseMetadata(operation, designBefore.updatedAt),
        kind: "node.updateGeometry",
        payload: {
          nodeId: node.id,
          geometry: node.geometry,
        },
      };
    }
    case "node.updateStyle": {
      const node = designBefore.nodes[operation.payload.nodeId];
      if (!node || !hasStyle(node)) {
        throw new Error(`Cannot invert style update for missing node ${operation.payload.nodeId}`);
      }
      return {
        ...inverseMetadata(operation, designBefore.updatedAt),
        kind: "node.updateStyle",
        payload: {
          nodeId: node.id,
          style: node.style,
        },
      };
    }
    case "node.updateMeta": {
      const node = designBefore.nodes[operation.payload.nodeId];
      if (!node) {
        throw new Error(`Cannot invert metadata update for missing node ${operation.payload.nodeId}`);
      }
      return {
        ...inverseMetadata(operation, designBefore.updatedAt),
        kind: "node.updateMeta",
        payload: {
          nodeId: node.id,
          name: node.name,
          locked: node.locked,
          visible: node.visible,
        },
      };
    }
    case "node.reparent": {
      const node = designBefore.nodes[operation.payload.nodeId];
      if (!node) {
        throw new Error(`Cannot invert reparent for missing node ${operation.payload.nodeId}`);
      }
      return {
        ...inverseMetadata(operation, designBefore.updatedAt),
        kind: "node.reparent",
        payload: {
          nodeId: node.id,
          parentId: node.parentId,
          index: indexInParent(designBefore, node),
        },
      };
    }
    case "node.reorder":
      return {
        ...inverseMetadata(operation, designBefore.updatedAt),
        kind: "node.reorder",
        payload: {
          parentId: operation.payload.parentId,
          orderedIds: currentOrder(designBefore, operation),
        },
      };
    case "node.delete": {
      const deletedIds = new Set(collectSubtreeIds(designBefore.nodes, operation.payload.nodeId));
      const nodes = Object.fromEntries(
        (Object.entries(designBefore.nodes) as [NodeId, SceneNode][]).filter(([nodeId]) => deletedIds.has(nodeId)),
      ) as Record<NodeId, SceneNode>;

      return {
        ...inverseMetadata(operation, designBefore.updatedAt),
        kind: "node.restore",
        payload: {
          nodes,
          rootIds: designBefore.rootIds,
          parentChildren: containerChildrenSnapshot(designBefore),
        },
      };
    }
    case "node.restore":
      return {
        ...inverseMetadata(operation, designBefore.updatedAt),
        kind: "node.delete",
        payload: {
          nodeId: Object.keys(operation.payload.nodes)[0] as NodeId,
        },
      };
  }
}

export function invertTransaction(designBefore: DesignFile, transaction: Transaction): Transaction {
  const inverses: DesignOperation[] = [];
  let currentDesign = designBefore;

  for (const operation of transaction.operations) {
    inverses.unshift(invertOperation(currentDesign, operation));
    currentDesign = applyOperation(currentDesign, operation);
  }

  return {
    id: `${transaction.id}:inverse`,
    label: `Undo ${transaction.label}`,
    operations: inverses,
  };
}
