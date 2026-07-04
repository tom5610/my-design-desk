import type { DesignFile, Geometry, NodeId, SceneNode } from "../model";
import { assertValidDesign } from "../model";
import type { NodeStyle } from "../model/styles";
import type {
  DesignOperation,
  ComponentCreateOperation,
  ComponentDeleteOperation,
  NodeCreateOperation,
  NodeDeleteOperation,
  NodeReorderOperation,
  NodeReparentOperation,
  NodeRestoreOperation,
  NodeUpdateGeometryOperation,
  NodeUpdateInstanceOverridesOperation,
  NodeUpdateConstraintsOperation,
  NodeUpdateMetaOperation,
  NodeUpdateStyleOperation,
  Transaction,
} from "./types";

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

function insertAt<T>(items: readonly T[], item: T, index = items.length) {
  const next = [...items];
  const boundedIndex = Math.max(0, Math.min(index, next.length));
  next.splice(boundedIndex, 0, item);
  return next;
}

function removeItem<T>(items: readonly T[], item: T) {
  return items.filter((candidate) => candidate !== item);
}

function replaceNode(design: DesignFile, node: SceneNode, timestamp: string): DesignFile {
  const nextDesign = {
    ...design,
    updatedAt: timestamp,
    nodes: {
      ...design.nodes,
      [node.id]: node,
    },
  };
  assertValidDesign(nextDesign);
  return nextDesign;
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

function createNode(design: DesignFile, operation: NodeCreateOperation): DesignFile {
  const { node, index } = operation.payload;
  if (design.nodes[node.id]) {
    throw new Error(`Cannot create duplicate node ${node.id}`);
  }

  const nodes: Record<NodeId, SceneNode> = {
    ...design.nodes,
    [node.id]: node,
  };

  let rootIds = design.rootIds;

  if (node.parentId === null) {
    rootIds = insertAt(rootIds, node.id, index);
  } else {
    const parent = nodes[node.parentId];
    if (!parent || !isContainerNode(parent)) {
      throw new Error(`Cannot create node under missing or non-container parent ${node.parentId}`);
    }

    nodes[node.parentId] = {
      ...parent,
      children: insertAt(parent.children, node.id, index),
    };
  }

  const nextDesign = {
    ...design,
    updatedAt: operation.timestamp,
    rootIds,
    nodes,
  };
  assertValidDesign(nextDesign);
  return nextDesign;
}

function updateGeometry(design: DesignFile, operation: NodeUpdateGeometryOperation): DesignFile {
  const node = design.nodes[operation.payload.nodeId];
  if (!node || !hasGeometry(node)) {
    throw new Error(`Cannot update geometry for missing or geometry-less node ${operation.payload.nodeId}`);
  }

  return replaceNode(
    design,
    {
      ...node,
      geometry: operation.payload.geometry,
    },
    operation.timestamp,
  );
}

function updateStyle(design: DesignFile, operation: NodeUpdateStyleOperation): DesignFile {
  const node = design.nodes[operation.payload.nodeId];
  if (!node || !hasStyle(node)) {
    throw new Error(`Cannot update style for missing or style-less node ${operation.payload.nodeId}`);
  }

  return replaceNode(
    design,
    {
      ...node,
      style: operation.payload.style,
    },
    operation.timestamp,
  );
}

function updateMeta(design: DesignFile, operation: NodeUpdateMetaOperation): DesignFile {
  const node = design.nodes[operation.payload.nodeId];
  if (!node) {
    throw new Error(`Cannot update metadata for missing node ${operation.payload.nodeId}`);
  }

  return replaceNode(
    design,
    {
      ...node,
      name: operation.payload.name ?? node.name,
      locked: operation.payload.locked ?? node.locked,
      visible: operation.payload.visible ?? node.visible,
    },
    operation.timestamp,
  );
}

function updateConstraints(design: DesignFile, operation: NodeUpdateConstraintsOperation): DesignFile {
  const node = design.nodes[operation.payload.nodeId];
  if (!node || !("constraints" in node)) {
    throw new Error(`Cannot update constraints for missing node ${operation.payload.nodeId}`);
  }

  return replaceNode(
    design,
    {
      ...node,
      constraints: operation.payload.constraints,
    },
    operation.timestamp,
  );
}

function updateInstanceOverrides(design: DesignFile, operation: NodeUpdateInstanceOverridesOperation): DesignFile {
  const node = design.nodes[operation.payload.nodeId];
  if (!node || node.kind !== "ComponentInstance") {
    throw new Error(`Cannot update overrides for missing or non-instance node ${operation.payload.nodeId}`);
  }

  return replaceNode(
    design,
    {
      ...node,
      overrides: operation.payload.overrides,
    },
    operation.timestamp,
  );
}

function reparentNode(design: DesignFile, operation: NodeReparentOperation): DesignFile {
  const node = design.nodes[operation.payload.nodeId];
  if (!node) {
    throw new Error(`Cannot reparent missing node ${operation.payload.nodeId}`);
  }

  const nodes = { ...design.nodes };
  let rootIds = removeItem(design.rootIds, node.id);

  if (node.parentId !== null) {
    const oldParent = nodes[node.parentId];
    if (oldParent && isContainerNode(oldParent)) {
      nodes[node.parentId] = {
        ...oldParent,
        children: removeItem(oldParent.children, node.id),
      };
    }
  }

  const nextNode = {
    ...node,
    parentId: operation.payload.parentId,
  };
  nodes[node.id] = nextNode;

  if (operation.payload.parentId === null) {
    rootIds = insertAt(rootIds, node.id, operation.payload.index);
  } else {
    const newParent = nodes[operation.payload.parentId];
    if (!newParent || !isContainerNode(newParent)) {
      throw new Error(`Cannot reparent node under missing or non-container parent ${operation.payload.parentId}`);
    }

    nodes[operation.payload.parentId] = {
      ...newParent,
      children: insertAt(newParent.children, node.id, operation.payload.index),
    };
  }

  const nextDesign = {
    ...design,
    updatedAt: operation.timestamp,
    rootIds,
    nodes,
  };
  assertValidDesign(nextDesign);
  return nextDesign;
}

function reorderNodes(design: DesignFile, operation: NodeReorderOperation): DesignFile {
  const { parentId, orderedIds } = operation.payload;

  if (parentId === null) {
    const nextDesign = {
      ...design,
      updatedAt: operation.timestamp,
      rootIds: orderedIds,
    };
    assertValidDesign(nextDesign);
    return nextDesign;
  }

  const parent = design.nodes[parentId];
  if (!parent || !isContainerNode(parent)) {
    throw new Error(`Cannot reorder missing or non-container parent ${parentId}`);
  }

  return replaceNode(
    design,
    {
      ...parent,
      children: orderedIds,
    },
    operation.timestamp,
  );
}

function deleteNode(design: DesignFile, operation: NodeDeleteOperation): DesignFile {
  const node = design.nodes[operation.payload.nodeId];
  if (!node) {
    return design;
  }

  const deleteIds = new Set(collectSubtreeIds(design.nodes, node.id));
  const nodes = Object.fromEntries(
    (Object.entries(design.nodes) as [NodeId, SceneNode][]).filter(([nodeId]) => !deleteIds.has(nodeId)),
  ) as Record<NodeId, SceneNode>;

  const rootIds = design.rootIds.filter((rootId) => !deleteIds.has(rootId));

  for (const [nodeId, candidate] of Object.entries(nodes) as [NodeId, SceneNode][]) {
    if (isContainerNode(candidate)) {
      nodes[nodeId] = {
        ...candidate,
        children: candidate.children.filter((childId) => !deleteIds.has(childId)),
      };
    }
  }

  const nextDesign = {
    ...design,
    updatedAt: operation.timestamp,
    rootIds,
    nodes,
  };
  assertValidDesign(nextDesign);
  return nextDesign;
}

function restoreNodes(design: DesignFile, operation: NodeRestoreOperation): DesignFile {
  const nodes = {
    ...design.nodes,
    ...operation.payload.nodes,
  };

  for (const [parentId, children] of Object.entries(operation.payload.parentChildren) as [NodeId, readonly NodeId[]][]) {
    const parent = nodes[parentId];
    if (parent && isContainerNode(parent)) {
      nodes[parentId] = {
        ...parent,
        children,
      };
    }
  }

  const nextDesign = {
    ...design,
    updatedAt: operation.timestamp,
    rootIds: operation.payload.rootIds,
    nodes,
  };
  assertValidDesign(nextDesign);
  return nextDesign;
}

function createComponent(design: DesignFile, operation: ComponentCreateOperation): DesignFile {
  const { component, rootNode, index } = operation.payload;

  if (design.components[component.id]) {
    throw new Error(`Cannot create duplicate component ${component.id}`);
  }
  if (design.nodes[rootNode.id]) {
    throw new Error(`Cannot create duplicate component root ${rootNode.id}`);
  }
  if (component.rootNodeId !== rootNode.id) {
    throw new Error(`Component ${component.id} root does not match created root node`);
  }

  const nodes: Record<NodeId, SceneNode> = {
    ...design.nodes,
    [rootNode.id]: rootNode,
  };
  let rootIds = design.rootIds;

  if (rootNode.parentId === null) {
    rootIds = insertAt(rootIds, rootNode.id, index);
  } else {
    const parent = nodes[rootNode.parentId];
    if (!parent || !isContainerNode(parent)) {
      throw new Error(`Cannot create component root under missing or non-container parent ${rootNode.parentId}`);
    }
    nodes[rootNode.parentId] = {
      ...parent,
      children: insertAt(parent.children, rootNode.id, index),
    };
  }

  const nextDesign = {
    ...design,
    updatedAt: operation.timestamp,
    rootIds,
    nodes,
    components: {
      ...design.components,
      [component.id]: component,
    },
  };
  assertValidDesign(nextDesign);
  return nextDesign;
}

function deleteComponent(design: DesignFile, operation: ComponentDeleteOperation): DesignFile {
  const component = design.components[operation.payload.componentId];
  if (!component) {
    return design;
  }

  const root = design.nodes[component.rootNodeId];
  if (!root) {
    const components = { ...design.components };
    delete components[operation.payload.componentId];
    return {
      ...design,
      updatedAt: operation.timestamp,
      components,
    };
  }

  const deleteIds = new Set(collectSubtreeIds(design.nodes, root.id));
  const nodes = Object.fromEntries(
    (Object.entries(design.nodes) as [NodeId, SceneNode][]).filter(([nodeId]) => !deleteIds.has(nodeId)),
  ) as Record<NodeId, SceneNode>;
  const rootIds = design.rootIds.filter((rootId) => !deleteIds.has(rootId));

  for (const [nodeId, candidate] of Object.entries(nodes) as [NodeId, SceneNode][]) {
    if (isContainerNode(candidate)) {
      nodes[nodeId] = {
        ...candidate,
        children: candidate.children.filter((childId) => !deleteIds.has(childId)),
      };
    }
  }

  const components = { ...design.components };
  delete components[component.id];
  const nextDesign = {
    ...design,
    updatedAt: operation.timestamp,
    rootIds,
    nodes,
    components,
  };
  assertValidDesign(nextDesign);
  return nextDesign;
}

export function applyOperation(design: DesignFile, operation: DesignOperation): DesignFile {
  switch (operation.kind) {
    case "node.create":
      return createNode(design, operation);
    case "node.updateGeometry":
      return updateGeometry(design, operation);
    case "node.updateStyle":
      return updateStyle(design, operation);
    case "node.updateMeta":
      return updateMeta(design, operation);
    case "node.updateConstraints":
      return updateConstraints(design, operation);
    case "node.updateInstanceOverrides":
      return updateInstanceOverrides(design, operation);
    case "node.reparent":
      return reparentNode(design, operation);
    case "node.reorder":
      return reorderNodes(design, operation);
    case "node.delete":
      return deleteNode(design, operation);
    case "node.restore":
      return restoreNodes(design, operation);
    case "component.create":
      return createComponent(design, operation);
    case "component.delete":
      return deleteComponent(design, operation);
  }
}

export function applyOperations(design: DesignFile, operations: readonly DesignOperation[]): DesignFile {
  return operations.reduce((currentDesign, operation) => applyOperation(currentDesign, operation), design);
}

export function applyTransaction(design: DesignFile, transaction: Transaction): DesignFile {
  return applyOperations(design, transaction.operations);
}
