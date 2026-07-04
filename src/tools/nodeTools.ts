import { createDeterministicIdFactory, defaultConstraints, defaultNodeStyle, type DeterministicIdFactory, type NodeId, type SceneNode } from "../model";
import type { OperationMetadata, NodeCreateOperation } from "../ops";

export const creationTools = ["Frame", "Group", "Rectangle", "Ellipse", "Line", "Text", "Image", "Button", "Icon", "ChartPlaceholder"] as const;

export type CreationTool = (typeof creationTools)[number];

export function createToolIdFactory(seed = "canvas-tools"): DeterministicIdFactory {
  return createDeterministicIdFactory(seed);
}

export function createNodeForTool(tool: CreationTool, point: { x: number; y: number }, parentId: NodeId | null, ids: DeterministicIdFactory): SceneNode {
  const id = ids.node(tool);
  const geometry = { x: point.x, y: point.y, width: 180, height: 120, rotation: 0 };
  const base = {
    id,
    name: `New ${tool}`,
    parentId: tool === "Frame" ? null : parentId,
    locked: false,
    visible: true,
    constraints: defaultConstraints,
  };

  switch (tool) {
    case "Frame":
      return {
        ...base,
        kind: "Frame",
        geometry: { ...geometry, width: 420, height: 260 },
        style: { ...defaultNodeStyle, fills: [{ kind: "solid", color: "#f8fafc" }] },
        children: [],
      };
    case "Group":
      return {
        ...base,
        kind: "Group",
        geometry,
        children: [],
      };
    case "Rectangle":
      return {
        ...base,
        kind: "Rectangle",
        geometry,
        style: { ...defaultNodeStyle, fills: [{ kind: "solid", color: "#ccfbf1" }], stroke: { color: "#0f766e", width: 1 }, radius: 12 },
      };
    case "Ellipse":
      return {
        ...base,
        kind: "Ellipse",
        geometry,
        style: { ...defaultNodeStyle, fills: [{ kind: "solid", color: "#dbeafe" }], stroke: { color: "#2563eb", width: 1 } },
      };
    case "Line":
      return {
        ...base,
        kind: "Line",
        start: point,
        end: { x: point.x + 180, y: point.y + 80 },
        stroke: { color: "#111827", width: 3 },
      };
    case "Text":
      return {
        ...base,
        kind: "Text",
        geometry: { ...geometry, width: 320, height: 48 },
        text: "New text",
        textStyle: {
          id: ids.style("created-text"),
          name: "Created Text",
          fontFamily: "Inter",
          fontSize: 28,
          fontWeight: 700,
          lineHeight: 34,
          letterSpacing: 0,
          color: "#111827",
        },
      };
    case "Image":
      return {
        ...base,
        kind: "Image",
        geometry,
        src: "/assets/local-image-placeholder.png",
        alt: "Local placeholder image",
        style: { ...defaultNodeStyle, fills: [{ kind: "solid", color: "#e0f2fe" }], radius: 12 },
      };
    case "Button":
      return {
        ...base,
        kind: "Button",
        geometry: { ...geometry, width: 180, height: 52 },
        label: "New button",
        style: { ...defaultNodeStyle, fills: [{ kind: "solid", color: "#111827" }], radius: 8 },
        textStyle: {
          id: ids.style("created-button-text"),
          name: "Created Button Text",
          fontFamily: "Inter",
          fontSize: 16,
          fontWeight: 700,
          lineHeight: 20,
          letterSpacing: 0,
          color: "#ffffff",
        },
        children: [],
      };
    case "Icon":
      return {
        ...base,
        kind: "Icon",
        geometry: { ...geometry, width: 48, height: 48 },
        svgPath: "M12 2l2.8 6.2L21 11l-6.2 2.8L12 20l-2.8-6.2L3 11l6.2-2.8L12 2z",
        color: "#0f766e",
      };
    case "ChartPlaceholder":
      return {
        ...base,
        kind: "ChartPlaceholder",
        geometry: { ...geometry, width: 280, height: 200 },
        chartType: "bar",
        style: { ...defaultNodeStyle, fills: [{ kind: "solid", color: "#ffffff" }], stroke: { color: "#d0d5dd", width: 1 }, radius: 14 },
      };
  }
}

export function createNodeOperation(
  tool: CreationTool,
  point: { x: number; y: number },
  parentId: NodeId | null,
  ids: DeterministicIdFactory,
  metadata: OperationMetadata,
): NodeCreateOperation {
  return {
    ...metadata,
    kind: "node.create",
    payload: {
      node: createNodeForTool(tool, point, parentId, ids),
    },
  };
}
