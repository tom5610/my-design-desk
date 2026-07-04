import type { DesignFile, NodeId, PrototypeLink, PrototypeLinkId, SceneNode } from "../model";
import { createTransaction, type OperationMetadata, type Transaction } from "../ops";

export function createPrototypeLinkTransaction(
  linkId: PrototypeLinkId,
  fromNodeId: NodeId,
  toNodeId: NodeId,
  metadata: OperationMetadata,
): Transaction {
  return createTransaction("tx_create_prototype_link", "Create prototype link", [
    {
      ...metadata,
      kind: "prototype.createLink",
      payload: {
        link: {
          id: linkId,
          fromNodeId,
          toNodeId,
          trigger: "click",
        },
      },
    },
  ]);
}

export function navigatePrototype(design: DesignFile, fromNodeId: NodeId): NodeId | null {
  const link = Object.values(design.prototypeLinks).find((candidate) => candidate.fromNodeId === fromNodeId);
  return link?.toNodeId ?? null;
}

export function findContainingFrameId(design: DesignFile, nodeId: NodeId): NodeId | null {
  let current: SceneNode | undefined = design.nodes[nodeId];

  while (current) {
    if (current.kind === "Frame") {
      return current.id;
    }
    current = current.parentId ? design.nodes[current.parentId] : undefined;
  }

  return null;
}

function isDescendantOfFrame(design: DesignFile, nodeId: NodeId, frameId: NodeId): boolean {
  let current: SceneNode | undefined = design.nodes[nodeId];

  while (current) {
    if (current.id === frameId) {
      return true;
    }
    current = current.parentId ? design.nodes[current.parentId] : undefined;
  }

  return false;
}

export type PrototypeHotspot = {
  link: PrototypeLink;
  source: SceneNode;
  target: SceneNode;
};

export function getPrototypeHotspots(design: DesignFile, frameId: NodeId): readonly PrototypeHotspot[] {
  return Object.values(design.prototypeLinks).flatMap((link) => {
    const source = design.nodes[link.fromNodeId];
    const target = design.nodes[link.toNodeId];
    if (!source || !target || !isDescendantOfFrame(design, source.id, frameId)) {
      return [];
    }
    return [{ link, source, target }];
  });
}
