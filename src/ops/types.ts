import type { NodeId } from "../model/ids";
import type { Geometry, SceneNode } from "../model/scene";
import type { NodeStyle } from "../model/styles";

export type OperationMetadata = {
  opId: string;
  sessionId: string;
  clientId: string;
  actorId: string;
  sequence: number | null;
  timestamp: string;
};

export type NodeCreateOperation = OperationMetadata & {
  kind: "node.create";
  payload: {
    node: SceneNode;
    index?: number;
  };
};

export type NodeUpdateGeometryOperation = OperationMetadata & {
  kind: "node.updateGeometry";
  payload: {
    nodeId: NodeId;
    geometry: Geometry;
  };
};

export type NodeUpdateStyleOperation = OperationMetadata & {
  kind: "node.updateStyle";
  payload: {
    nodeId: NodeId;
    style: NodeStyle;
  };
};

export type NodeUpdateMetaOperation = OperationMetadata & {
  kind: "node.updateMeta";
  payload: {
    nodeId: NodeId;
    name?: string;
    locked?: boolean;
    visible?: boolean;
  };
};

export type NodeReparentOperation = OperationMetadata & {
  kind: "node.reparent";
  payload: {
    nodeId: NodeId;
    parentId: NodeId | null;
    index?: number;
  };
};

export type NodeReorderOperation = OperationMetadata & {
  kind: "node.reorder";
  payload: {
    parentId: NodeId | null;
    orderedIds: readonly NodeId[];
  };
};

export type NodeDeleteOperation = OperationMetadata & {
  kind: "node.delete";
  payload: {
    nodeId: NodeId;
  };
};

export type NodeRestoreOperation = OperationMetadata & {
  kind: "node.restore";
  payload: {
    nodes: Record<NodeId, SceneNode>;
    rootIds: readonly NodeId[];
    parentChildren: Record<NodeId, readonly NodeId[]>;
  };
};

export type DesignOperation =
  | NodeCreateOperation
  | NodeUpdateGeometryOperation
  | NodeUpdateStyleOperation
  | NodeUpdateMetaOperation
  | NodeReparentOperation
  | NodeReorderOperation
  | NodeDeleteOperation
  | NodeRestoreOperation;

export type Transaction = {
  id: string;
  label: string;
  operations: readonly DesignOperation[];
};
