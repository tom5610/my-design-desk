import type { DesignFile, Geometry, NodeId, SceneNode } from "../model";
import type { NodeStyle } from "../model/styles";
import { serializeDesign } from "../serialization";
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

function serializeRestorableDocument(design: Pick<DesignFile, "comments" | "components" | "nodes" | "prototypeLinks" | "rootIds" | "styles">) {
  return serializeDesign({
    schemaVersion: 1,
    id: "snapshot-compare",
    name: "Snapshot Compare",
    createdAt: "1970-01-01T00:00:00.000Z",
    updatedAt: "1970-01-01T00:00:00.000Z",
    rootIds: design.rootIds,
    nodes: design.nodes,
    components: design.components,
    comments: design.comments,
    prototypeLinks: design.prototypeLinks,
    snapshots: {},
    styles: design.styles,
    ops: [],
  });
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
    case "node.updateConstraints": {
      const node = designBefore.nodes[operation.payload.nodeId];
      if (!node) {
        throw new Error(`Cannot invert constraints update for missing node ${operation.payload.nodeId}`);
      }
      return {
        ...inverseMetadata(operation, designBefore.updatedAt),
        kind: "node.updateConstraints",
        payload: {
          nodeId: node.id,
          constraints: node.constraints,
        },
      };
    }
    case "node.updateInstanceOverrides": {
      const node = designBefore.nodes[operation.payload.nodeId];
      if (!node || node.kind !== "ComponentInstance") {
        throw new Error(`Cannot invert instance override update for missing instance ${operation.payload.nodeId}`);
      }
      return {
        ...inverseMetadata(operation, designBefore.updatedAt),
        kind: "node.updateInstanceOverrides",
        payload: {
          nodeId: node.id,
          overrides: node.overrides,
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
    case "component.create":
      return {
        ...inverseMetadata(operation, designBefore.updatedAt),
        kind: "component.delete",
        payload: {
          componentId: operation.payload.component.id,
        },
      };
    case "component.delete": {
      const component = designBefore.components[operation.payload.componentId];
      if (!component) {
        throw new Error(`Cannot invert component delete for missing component ${operation.payload.componentId}`);
      }
      const rootNode = designBefore.nodes[component.rootNodeId];
      if (!rootNode || rootNode.kind !== "ComponentRoot") {
        throw new Error(`Cannot invert component delete for missing root ${component.rootNodeId}`);
      }
      return {
        ...inverseMetadata(operation, designBefore.updatedAt),
        kind: "component.create",
        payload: {
          component,
          rootNode,
        },
      };
    }
    case "comment.create":
      return {
        ...inverseMetadata(operation, designBefore.updatedAt),
        kind: "comment.delete",
        payload: {
          commentId: operation.payload.thread.id,
        },
      };
    case "comment.delete": {
      const thread = designBefore.comments[operation.payload.commentId];
      if (!thread) {
        throw new Error(`Cannot invert comment delete for missing comment ${operation.payload.commentId}`);
      }
      return {
        ...inverseMetadata(operation, designBefore.updatedAt),
        kind: "comment.create",
        payload: {
          thread,
        },
      };
    }
    case "comment.addMessage":
      return {
        ...inverseMetadata(operation, designBefore.updatedAt),
        kind: "comment.removeMessage",
        payload: {
          commentId: operation.payload.commentId,
          messageId: operation.payload.message.id,
        },
      };
    case "comment.removeMessage": {
      const thread = designBefore.comments[operation.payload.commentId];
      const message = thread?.messages.find((candidate) => candidate.id === operation.payload.messageId);
      if (!thread || !message) {
        throw new Error(`Cannot invert comment message removal for ${operation.payload.messageId}`);
      }
      return {
        ...inverseMetadata(operation, designBefore.updatedAt),
        kind: "comment.addMessage",
        payload: {
          commentId: thread.id,
          message,
        },
      };
    }
    case "comment.setResolved": {
      const thread = designBefore.comments[operation.payload.commentId];
      if (!thread) {
        throw new Error(`Cannot invert missing comment resolution ${operation.payload.commentId}`);
      }
      return {
        ...inverseMetadata(operation, designBefore.updatedAt),
        kind: "comment.setResolved",
        payload: {
          commentId: thread.id,
          resolved: thread.resolved,
        },
      };
    }
    case "snapshot.create":
      return {
        ...inverseMetadata(operation, designBefore.updatedAt),
        kind: "snapshot.delete",
        payload: {
          snapshotId: operation.payload.snapshot.id,
        },
      };
    case "snapshot.delete": {
      const snapshot = designBefore.snapshots[operation.payload.snapshotId];
      if (!snapshot) {
        throw new Error(`Cannot invert snapshot delete for missing snapshot ${operation.payload.snapshotId}`);
      }
      return {
        ...inverseMetadata(operation, designBefore.updatedAt),
        kind: "snapshot.create",
        payload: {
          snapshot,
        },
      };
    }
    case "snapshot.restore": {
      const latestSnapshot = Object.values(designBefore.snapshots).find(
        (snapshot) => serializeRestorableDocument(snapshot.document) === serializeRestorableDocument({
          rootIds: designBefore.rootIds,
          nodes: designBefore.nodes,
          components: designBefore.components,
          comments: designBefore.comments,
          prototypeLinks: designBefore.prototypeLinks,
          styles: designBefore.styles,
        }),
      );
      if (!latestSnapshot) {
        throw new Error("Cannot invert snapshot restore without a matching previous snapshot");
      }
      return {
        ...inverseMetadata(operation, designBefore.updatedAt),
        kind: "snapshot.restore",
        payload: {
          snapshotId: latestSnapshot.id,
        },
      };
    }
    case "prototype.createLink":
      return {
        ...inverseMetadata(operation, designBefore.updatedAt),
        kind: "prototype.deleteLink",
        payload: {
          linkId: operation.payload.link.id,
        },
      };
    case "prototype.deleteLink": {
      const link = designBefore.prototypeLinks[operation.payload.linkId];
      if (!link) {
        throw new Error(`Cannot invert prototype link delete for missing link ${operation.payload.linkId}`);
      }
      return {
        ...inverseMetadata(operation, designBefore.updatedAt),
        kind: "prototype.createLink",
        payload: {
          link,
        },
      };
    }
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
