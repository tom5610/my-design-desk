import type { CommentId, ComponentId, NodeId, PrototypeLinkId, SnapshotId } from "./ids";
import type { ColorValue, NodeStyle, StyleTokens, TextStyle } from "./styles";

export const requiredNodeKinds = [
  "Frame",
  "Group",
  "Rectangle",
  "Ellipse",
  "Line",
  "Text",
  "Image",
  "Button",
  "Icon",
  "ChartPlaceholder",
  "ComponentRoot",
  "ComponentInstance",
] as const;

export type NodeKind = (typeof requiredNodeKinds)[number];

export type Point = {
  x: number;
  y: number;
};

export type Size = {
  width: number;
  height: number;
};

export type Geometry = Point &
  Size & {
    rotation: number;
  };

export type Constraints = {
  horizontal: "left" | "right" | "leftRight" | "center" | "scale";
  vertical: "top" | "bottom" | "topBottom" | "center" | "scale";
};

export type BaseNode = {
  id: NodeId;
  kind: NodeKind;
  name: string;
  parentId: NodeId | null;
  locked: boolean;
  visible: boolean;
  geometry: Geometry;
  constraints: Constraints;
};

export type ContainerNode = BaseNode & {
  children: readonly NodeId[];
};

export type FrameNode = ContainerNode & {
  kind: "Frame";
  style: NodeStyle;
};

export type GroupNode = ContainerNode & {
  kind: "Group";
};

export type RectangleNode = BaseNode & {
  kind: "Rectangle";
  style: NodeStyle;
};

export type EllipseNode = BaseNode & {
  kind: "Ellipse";
  style: NodeStyle;
};

export type LineNode = Omit<BaseNode, "geometry"> & {
  kind: "Line";
  start: Point;
  end: Point;
  stroke: {
    color: ColorValue;
    width: number;
  };
};

export type TextNode = BaseNode & {
  kind: "Text";
  text: string;
  textStyle: TextStyle;
};

export type ImageNode = BaseNode & {
  kind: "Image";
  src: string;
  alt: string;
  style: NodeStyle;
};

export type ButtonNode = ContainerNode & {
  kind: "Button";
  label: string;
  style: NodeStyle;
  textStyle: TextStyle;
};

export type IconNode = BaseNode & {
  kind: "Icon";
  svgPath: string;
  color: ColorValue;
};

export type ChartPlaceholderNode = BaseNode & {
  kind: "ChartPlaceholder";
  chartType: "bar" | "line" | "area" | "donut";
  style: NodeStyle;
};

export type ComponentRootNode = ContainerNode & {
  kind: "ComponentRoot";
  componentId: ComponentId;
};

export type ComponentInstanceNode = BaseNode & {
  kind: "ComponentInstance";
  componentId: ComponentId;
  overrides: Record<string, string | number | boolean>;
};

export type SceneNode =
  | FrameNode
  | GroupNode
  | RectangleNode
  | EllipseNode
  | LineNode
  | TextNode
  | ImageNode
  | ButtonNode
  | IconNode
  | ChartPlaceholderNode
  | ComponentRootNode
  | ComponentInstanceNode;

export type ComponentDefinition = {
  id: ComponentId;
  name: string;
  rootNodeId: NodeId;
};

export type CommentThread = {
  id: CommentId;
  nodeId: NodeId;
  position: Point;
  resolved: boolean;
  messages: readonly {
    id: string;
    author: string;
    body: string;
    createdAt: string;
  }[];
};

export type PrototypeLink = {
  id: PrototypeLinkId;
  fromNodeId: NodeId;
  toNodeId: NodeId;
  trigger: "click";
};

export type Snapshot = {
  id: SnapshotId;
  name: string;
  createdAt: string;
  rootIds: readonly NodeId[];
  document: {
    rootIds: readonly NodeId[];
    nodes: Record<NodeId, SceneNode>;
    components: Record<ComponentId, ComponentDefinition>;
    comments: Record<CommentId, CommentThread>;
    prototypeLinks: Record<PrototypeLinkId, PrototypeLink>;
    styles: StyleTokens;
  };
};

export type DesignFile = {
  schemaVersion: 1;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  rootIds: readonly NodeId[];
  nodes: Record<NodeId, SceneNode>;
  components: Record<ComponentId, ComponentDefinition>;
  comments: Record<CommentId, CommentThread>;
  prototypeLinks: Record<PrototypeLinkId, PrototypeLink>;
  snapshots: Record<SnapshotId, Snapshot>;
  styles: StyleTokens;
  ops: readonly unknown[];
};

export const defaultConstraints: Constraints = {
  horizontal: "left",
  vertical: "top",
};
