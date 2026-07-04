import { resolveComponentInstance, type ComponentOverrides } from "../model/components";
import { defaultConstraints, type ComponentId, type DesignFile, type Geometry, type NodeId, type SceneNode } from "../model";
import { createTransaction, type DesignOperation, type OperationMetadata, type Transaction } from "../ops";

type ContainerNode = Extract<SceneNode, { children: readonly NodeId[] }>;
type GeometryNode = Extract<SceneNode, { geometry: Geometry }>;

function isContainer(node: SceneNode): node is ContainerNode {
  return "children" in node;
}

function hasGeometry(node: SceneNode): node is GeometryNode {
  return "geometry" in node;
}

function siblingIds(design: DesignFile, parentId: NodeId | null) {
  if (parentId === null) {
    return design.rootIds;
  }

  const parent = design.nodes[parentId];
  return parent && isContainer(parent) ? parent.children : [];
}

function selectionNodes(design: DesignFile, nodeIds: readonly NodeId[]) {
  return nodeIds.map((id) => design.nodes[id]).filter((node): node is SceneNode => Boolean(node));
}

function boundsFor(nodes: readonly GeometryNode[]): Geometry {
  const minX = Math.min(...nodes.map((node) => node.geometry.x));
  const minY = Math.min(...nodes.map((node) => node.geometry.y));
  const maxX = Math.max(...nodes.map((node) => node.geometry.x + node.geometry.width));
  const maxY = Math.max(...nodes.map((node) => node.geometry.y + node.geometry.height));

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    rotation: 0,
  };
}

function cloneForCreate(node: SceneNode, id: NodeId, parentId: NodeId | null): SceneNode {
  const base = {
    ...node,
    id,
    parentId,
  };

  return isContainer(base)
    ? {
        ...base,
        children: [],
      }
    : base;
}

function materializeResolvedNode(
  resolvedNodes: Record<NodeId, SceneNode>,
  resolvedId: NodeId,
  parentId: NodeId | null,
  createNodeId: (hint: string) => NodeId,
  metadata: (index: number) => OperationMetadata,
  operations: DesignOperation[],
) {
  const resolved = resolvedNodes[resolvedId];
  if (!resolved) {
    throw new Error(`Cannot materialize missing resolved node ${resolvedId}`);
  }

  const nodeId = createNodeId(resolved.name);
  const createIndex = operations.length;
  operations.push({
    ...metadata(createIndex),
    kind: "node.create",
    payload: {
      node: cloneForCreate(resolved, nodeId, parentId),
    },
  });

  if (isContainer(resolved)) {
    for (const childId of resolved.children) {
      materializeResolvedNode(resolvedNodes, childId, nodeId, createNodeId, metadata, operations);
    }
  }
}

export function createComponentFromSelectionTransaction(
  design: DesignFile,
  nodeIds: readonly NodeId[],
  componentId: ComponentId,
  rootNodeId: NodeId,
  instanceId: NodeId,
  metadata: (index: number) => OperationMetadata,
): Transaction {
  const nodes = selectionNodes(design, nodeIds).filter((node) => node.kind !== "ComponentRoot" && node.kind !== "ComponentInstance");
  const first = nodes[0];
  if (!first || !nodes.every((node) => node.parentId === first.parentId && hasGeometry(node))) {
    return createTransaction("tx_component_empty", "Create component", []);
  }

  const siblings = siblingIds(design, first.parentId);
  const orderedNodes = [...nodes].sort((left, right) => siblings.indexOf(left.id) - siblings.indexOf(right.id)) as GeometryNode[];
  const bounds = boundsFor(orderedNodes);
  const insertIndex = Math.min(...orderedNodes.map((node) => siblings.indexOf(node.id)).filter((index) => index >= 0));
  const componentName = `${first.name} component`;
  const operations: DesignOperation[] = [
    {
      ...metadata(0),
      kind: "component.create",
      payload: {
        component: {
          id: componentId,
          name: componentName,
          rootNodeId,
        },
        rootNode: {
          id: rootNodeId,
          kind: "ComponentRoot",
          name: componentName,
          parentId: first.parentId,
          locked: false,
          visible: false,
          geometry: bounds,
          constraints: defaultConstraints,
          componentId,
          children: [],
        },
      },
    },
    ...orderedNodes.map((node, index) => ({
      ...metadata(index + 1),
      kind: "node.reparent" as const,
      payload: {
        nodeId: node.id,
        parentId: rootNodeId,
      },
    })),
    {
      ...metadata(orderedNodes.length + 1),
      kind: "node.create",
      payload: {
        node: {
          id: instanceId,
          kind: "ComponentInstance",
          name: first.name,
          parentId: first.parentId,
          locked: false,
          visible: true,
          geometry: bounds,
          constraints: defaultConstraints,
          componentId,
          overrides: {},
        },
        index: insertIndex,
      },
    },
  ];

  return createTransaction("tx_create_component", "Create component", operations);
}

export function createInsertInstanceTransaction(
  design: DesignFile,
  componentId: ComponentId,
  instanceId: NodeId,
  metadata: OperationMetadata,
): Transaction {
  const component = design.components[componentId];
  const root = component ? design.nodes[component.rootNodeId] : null;
  if (!component || !root || root.kind !== "ComponentRoot") {
    return createTransaction("tx_insert_component_empty", "Insert component instance", []);
  }

  const parentId = design.rootIds[0] ?? null;
  const geometry = {
    ...root.geometry,
    x: root.geometry.x + root.geometry.width + 24,
  };

  return createTransaction("tx_insert_component_instance", "Insert component instance", [
    {
      ...metadata,
      kind: "node.create",
      payload: {
        node: {
          id: instanceId,
          kind: "ComponentInstance",
          name: `${component.name} instance`,
          parentId,
          locked: false,
          visible: true,
          geometry,
          constraints: defaultConstraints,
          componentId,
          overrides: {},
        },
      },
    },
  ]);
}

export function createUpdateInstanceOverridesTransaction(nodeId: NodeId, overrides: ComponentOverrides, metadata: OperationMetadata): Transaction {
  return createTransaction("tx_update_instance_overrides", "Update instance overrides", [
    {
      ...metadata,
      kind: "node.updateInstanceOverrides",
      payload: {
        nodeId,
        overrides,
      },
    },
  ]);
}

export function createDetachInstanceTransaction(
  design: DesignFile,
  instanceId: NodeId,
  createNodeId: (hint: string) => NodeId,
  metadata: (index: number) => OperationMetadata,
): Transaction {
  const instance = design.nodes[instanceId];
  if (!instance || instance.kind !== "ComponentInstance") {
    return createTransaction("tx_detach_component_empty", "Detach instance", []);
  }

  const resolved = resolveComponentInstance(design, instance);
  if (!resolved || resolved.childIds.length === 0) {
    return createTransaction("tx_detach_component_empty", "Detach instance", []);
  }

  const operations: DesignOperation[] = [];
  const parentId = instance.parentId;
  if (resolved.childIds.length === 1) {
    materializeResolvedNode(resolved.nodes, resolved.childIds[0], parentId, createNodeId, metadata, operations);
  } else {
    const groupId = createNodeId(`${instance.name} group`);
    operations.push({
      ...metadata(0),
      kind: "node.create",
      payload: {
        node: {
          id: groupId,
          kind: "Group",
          name: `${instance.name} detached`,
          parentId,
          locked: false,
          visible: true,
          geometry: instance.geometry,
          constraints: instance.constraints,
          children: [],
        },
      },
    });
    for (const childId of resolved.childIds) {
      materializeResolvedNode(resolved.nodes, childId, groupId, createNodeId, metadata, operations);
    }
  }

  operations.push({
    ...metadata(operations.length),
    kind: "node.delete",
    payload: {
      nodeId: instance.id,
    },
  });

  return createTransaction("tx_detach_component_instance", "Detach instance", operations);
}
