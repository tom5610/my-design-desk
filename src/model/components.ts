import type { NodeId } from "./ids";
import type { ComponentInstanceNode, DesignFile, Geometry, SceneNode } from "./scene";
import type { ColorValue, NodeStyle } from "./styles";

type ContainerNode = Extract<SceneNode, { children: readonly NodeId[] }>;
type GeometryNode = Extract<SceneNode, { geometry: Geometry }>;
type StyledNode = Extract<SceneNode, { style: NodeStyle }>;

export type ComponentOverrides = ComponentInstanceNode["overrides"];

export type ResolvedComponentTree = {
  nodes: Record<NodeId, SceneNode>;
  childIds: readonly NodeId[];
};

function isContainerNode(node: SceneNode): node is ContainerNode {
  return "children" in node;
}

function hasGeometry(node: SceneNode): node is GeometryNode {
  return "geometry" in node;
}

function hasStyle(node: SceneNode): node is StyledNode {
  return "style" in node;
}

function cloneId(instanceId: NodeId, masterId: NodeId) {
  return `${instanceId}__${masterId}` as NodeId;
}

function textOverride(overrides: ComponentOverrides, masterId: NodeId) {
  return overrides[`text:${masterId}`] ?? overrides.text ?? overrides.label;
}

function fillOverride(overrides: ComponentOverrides, masterId: NodeId) {
  return overrides[`fill:${masterId}`] ?? overrides.fill;
}

function applySolidFill(style: NodeStyle, fill: ColorValue): NodeStyle {
  return {
    ...style,
    fills: [{ kind: "solid", color: fill }, ...style.fills.filter((candidate) => candidate.kind !== "solid")],
  };
}

function transformPoint(point: { x: number; y: number }, root: Geometry, instance: Geometry) {
  const scaleX = root.width === 0 ? 1 : instance.width / root.width;
  const scaleY = root.height === 0 ? 1 : instance.height / root.height;

  return {
    x: instance.x + (point.x - root.x) * scaleX,
    y: instance.y + (point.y - root.y) * scaleY,
  };
}

function transformGeometry(geometry: Geometry, root: Geometry, instance: Geometry): Geometry {
  const scaleX = root.width === 0 ? 1 : instance.width / root.width;
  const scaleY = root.height === 0 ? 1 : instance.height / root.height;
  const origin = transformPoint(geometry, root, instance);

  return {
    ...origin,
    width: geometry.width * scaleX,
    height: geometry.height * scaleY,
    rotation: geometry.rotation,
  };
}

function applyOverrides(node: SceneNode, masterId: NodeId, overrides: ComponentOverrides): SceneNode {
  const nextText = textOverride(overrides, masterId);
  const nextFill = fillOverride(overrides, masterId);
  let nextNode = node;

  if (typeof nextText === "string") {
    if (nextNode.kind === "Text") {
      nextNode = { ...nextNode, text: nextText };
    } else if (nextNode.kind === "Button") {
      nextNode = { ...nextNode, label: nextText };
    }
  }

  if (typeof nextFill === "string" && hasStyle(nextNode)) {
    nextNode = { ...nextNode, style: applySolidFill(nextNode.style, nextFill as ColorValue) };
  }

  return nextNode;
}

function cloneMasterNode(
  design: DesignFile,
  masterId: NodeId,
  parentId: NodeId,
  instance: ComponentInstanceNode,
  rootGeometry: Geometry,
  resolved: Record<NodeId, SceneNode>,
): NodeId {
  const master = design.nodes[masterId];
  if (!master) {
    throw new Error(`Component master references missing node ${masterId}`);
  }

  const clonedId = cloneId(instance.id, master.id);
  let cloned: SceneNode = {
    ...master,
    id: clonedId,
    parentId,
  };

  if (hasGeometry(cloned)) {
    cloned = {
      ...cloned,
      geometry: transformGeometry(cloned.geometry, rootGeometry, instance.geometry),
    };
  } else if (cloned.kind === "Line") {
    cloned = {
      ...cloned,
      start: transformPoint(cloned.start, rootGeometry, instance.geometry),
      end: transformPoint(cloned.end, rootGeometry, instance.geometry),
    };
  }

  cloned = applyOverrides(cloned, master.id, instance.overrides);

  if (isContainerNode(cloned)) {
    const masterChildren = isContainerNode(master) ? master.children : [];
    const childIds = masterChildren.map((childId) => cloneMasterNode(design, childId, clonedId, instance, rootGeometry, resolved));
    cloned = {
      ...cloned,
      children: childIds,
    };
  }

  resolved[clonedId] = cloned;
  return clonedId;
}

export function resolveComponentInstance(design: DesignFile, instance: ComponentInstanceNode): ResolvedComponentTree | null {
  const component = design.components[instance.componentId];
  if (!component) {
    return null;
  }

  const root = design.nodes[component.rootNodeId];
  if (!root || root.kind !== "ComponentRoot") {
    return null;
  }

  const nodes: Record<NodeId, SceneNode> = {};
  const childIds = root.children.map((childId) => cloneMasterNode(design, childId, instance.id, instance, root.geometry, nodes));

  return {
    nodes,
    childIds,
  };
}
