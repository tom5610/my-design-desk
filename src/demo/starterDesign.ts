import { createDeterministicIdFactory } from "../model/ids";
import type { DesignFile, SceneNode } from "../model/scene";
import { defaultConstraints } from "../model/scene";
import type { ColorStyle, NodeStyle, TextStyle } from "../model/styles";

const timestamp = "2026-07-04T00:00:00.000Z";

export function createStarterDesign(): DesignFile {
  const ids = createDeterministicIdFactory("ai-builder-suite");

  const primaryColorId = ids.style("primary-teal");
  const inkColorId = ids.style("ink");
  const bodyTextId = ids.style("body-text");
  const headingTextId = ids.style("heading-text");
  const buttonComponentId = ids.component("primary-button");

  const colors: Record<string, ColorStyle> = {
    [primaryColorId]: {
      id: primaryColorId,
      name: "Primary Teal",
      value: "#0f766e",
    },
    [inkColorId]: {
      id: inkColorId,
      name: "Ink",
      value: "#111827",
    },
  };

  const bodyText: TextStyle = {
    id: bodyTextId,
    name: "Body",
    fontFamily: "Inter",
    fontSize: 16,
    fontWeight: 500,
    lineHeight: 24,
    letterSpacing: 0,
    color: "#344054",
  };

  const headingText: TextStyle = {
    id: headingTextId,
    name: "Heading",
    fontFamily: "Inter",
    fontSize: 48,
    fontWeight: 700,
    lineHeight: 56,
    letterSpacing: 0,
    color: "#111827",
  };

  const frameId = ids.node("landing-frame");
  const heroGroupId = ids.node("hero-group");
  const headlineId = ids.node("headline");
  const bodyId = ids.node("body-copy");
  const buttonRootId = ids.node("button-component-root");
  const buttonId = ids.node("primary-button");
  const chartId = ids.node("metrics-chart");
  const iconId = ids.node("spark-icon");
  const imageId = ids.node("local-preview-image");
  const instanceId = ids.node("button-instance");

  const cardStyle: NodeStyle = {
    fills: [{ kind: "solid", color: "#ffffff" }],
    opacity: 1,
    radius: 16,
    shadows: [{ x: 0, y: 18, blur: 40, spread: -18, color: "rgba(17, 24, 39, 0.26)" }],
    stroke: { color: "#d0d5dd", width: 1 },
  };

  const nodes: Record<string, SceneNode> = {
    [frameId]: {
      id: frameId,
      kind: "Frame",
      name: "AI Builder landing page",
      parentId: null,
      locked: false,
      visible: true,
      geometry: { x: 0, y: 0, width: 1440, height: 960, rotation: 0 },
      constraints: defaultConstraints,
      style: {
        fills: [{ kind: "solid", color: "#f8fafc" }],
        opacity: 1,
        shadows: [],
      },
      children: [heroGroupId, buttonRootId],
    },
    [heroGroupId]: {
      id: heroGroupId,
      kind: "Group",
      name: "Hero panel",
      parentId: frameId,
      locked: false,
      visible: true,
      geometry: { x: 120, y: 116, width: 1200, height: 620, rotation: 0 },
      constraints: defaultConstraints,
      children: [headlineId, bodyId, buttonId, chartId, iconId, imageId, instanceId],
    },
    [headlineId]: {
      id: headlineId,
      kind: "Text",
      name: "Hero headline",
      parentId: heroGroupId,
      locked: false,
      visible: true,
      geometry: { x: 160, y: 176, width: 620, height: 156, rotation: 0 },
      constraints: defaultConstraints,
      text: "Prototype, replay, and export deterministic design ops.",
      textStyle: headingText,
    },
    [bodyId]: {
      id: bodyId,
      kind: "Text",
      name: "Hero supporting copy",
      parentId: heroGroupId,
      locked: false,
      visible: true,
      geometry: { x: 164, y: 360, width: 520, height: 72, rotation: 0 },
      constraints: defaultConstraints,
      text: "A local-first editor seed for collaboration, version history, replay, and generated React output.",
      textStyle: bodyText,
    },
    [buttonId]: {
      id: buttonId,
      kind: "Button",
      name: "Start editing button",
      parentId: heroGroupId,
      locked: false,
      visible: true,
      geometry: { x: 164, y: 472, width: 176, height: 48, rotation: 0 },
      constraints: defaultConstraints,
      label: "Start editing",
      style: {
        fills: [{ kind: "solid", color: "#111827" }],
        opacity: 1,
        radius: 8,
        shadows: [],
      },
      textStyle: { ...bodyText, color: "#ffffff", fontWeight: 700 },
      children: [],
    },
    [chartId]: {
      id: chartId,
      kind: "ChartPlaceholder",
      name: "Metrics preview",
      parentId: heroGroupId,
      locked: false,
      visible: true,
      geometry: { x: 820, y: 184, width: 360, height: 260, rotation: 0 },
      constraints: defaultConstraints,
      chartType: "bar",
      style: cardStyle,
    },
    [iconId]: {
      id: iconId,
      kind: "Icon",
      name: "Spark icon",
      parentId: heroGroupId,
      locked: false,
      visible: true,
      geometry: { x: 824, y: 484, width: 48, height: 48, rotation: 0 },
      constraints: defaultConstraints,
      svgPath: "M12 2l2.8 6.2L21 11l-6.2 2.8L12 20l-2.8-6.2L3 11l6.2-2.8L12 2z",
      color: "#0f766e",
    },
    [imageId]: {
      id: imageId,
      kind: "Image",
      name: "Local preview image",
      parentId: heroGroupId,
      locked: false,
      visible: true,
      geometry: { x: 900, y: 484, width: 280, height: 120, rotation: 0 },
      constraints: defaultConstraints,
      src: "/assets/demo-preview-placeholder.png",
      alt: "Preview of generated design output",
      style: cardStyle,
    },
    [buttonRootId]: {
      id: buttonRootId,
      kind: "ComponentRoot",
      name: "Primary button component",
      parentId: frameId,
      locked: false,
      visible: false,
      geometry: { x: 120, y: 800, width: 176, height: 48, rotation: 0 },
      constraints: defaultConstraints,
      componentId: buttonComponentId,
      children: [],
    },
    [instanceId]: {
      id: instanceId,
      kind: "ComponentInstance",
      name: "Secondary CTA instance",
      parentId: heroGroupId,
      locked: false,
      visible: true,
      geometry: { x: 356, y: 472, width: 160, height: 48, rotation: 0 },
      constraints: defaultConstraints,
      componentId: buttonComponentId,
      overrides: {
        label: "View replay",
      },
    },
  };

  return {
    schemaVersion: 1,
    id: "design_ai-builder-suite",
    name: "AI Builder Suite",
    createdAt: timestamp,
    updatedAt: timestamp,
    rootIds: [frameId],
    nodes,
    components: {
      [buttonComponentId]: {
        id: buttonComponentId,
        name: "Primary Button",
        rootNodeId: buttonRootId,
      },
    },
    comments: {},
    prototypeLinks: {},
    snapshots: {},
    styles: {
      colors,
      text: {
        [bodyTextId]: bodyText,
        [headingTextId]: headingText,
      },
    },
    ops: [],
  };
}
