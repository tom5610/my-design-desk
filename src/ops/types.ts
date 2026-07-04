import type { CommentId, ComponentId, NodeId, PrototypeLinkId, SnapshotId } from "../model/ids";
import type { CommentThread, ComponentDefinition, ComponentRootNode, Constraints, Geometry, PrototypeLink, SceneNode, Snapshot } from "../model/scene";
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

export type NodeUpdateConstraintsOperation = OperationMetadata & {
  kind: "node.updateConstraints";
  payload: {
    nodeId: NodeId;
    constraints: Constraints;
  };
};

export type NodeUpdateInstanceOverridesOperation = OperationMetadata & {
  kind: "node.updateInstanceOverrides";
  payload: {
    nodeId: NodeId;
    overrides: Record<string, string | number | boolean>;
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

export type ComponentCreateOperation = OperationMetadata & {
  kind: "component.create";
  payload: {
    component: ComponentDefinition;
    rootNode: ComponentRootNode;
    index?: number;
  };
};

export type ComponentDeleteOperation = OperationMetadata & {
  kind: "component.delete";
  payload: {
    componentId: ComponentId;
  };
};

export type CommentCreateOperation = OperationMetadata & {
  kind: "comment.create";
  payload: {
    thread: CommentThread;
  };
};

export type CommentDeleteOperation = OperationMetadata & {
  kind: "comment.delete";
  payload: {
    commentId: CommentId;
  };
};

export type CommentAddMessageOperation = OperationMetadata & {
  kind: "comment.addMessage";
  payload: {
    commentId: CommentId;
    message: CommentThread["messages"][number];
  };
};

export type CommentRemoveMessageOperation = OperationMetadata & {
  kind: "comment.removeMessage";
  payload: {
    commentId: CommentId;
    messageId: string;
  };
};

export type CommentSetResolvedOperation = OperationMetadata & {
  kind: "comment.setResolved";
  payload: {
    commentId: CommentId;
    resolved: boolean;
  };
};

export type SnapshotCreateOperation = OperationMetadata & {
  kind: "snapshot.create";
  payload: {
    snapshot: Snapshot;
  };
};

export type SnapshotRestoreOperation = OperationMetadata & {
  kind: "snapshot.restore";
  payload: {
    snapshotId: SnapshotId;
  };
};

export type SnapshotDeleteOperation = OperationMetadata & {
  kind: "snapshot.delete";
  payload: {
    snapshotId: SnapshotId;
  };
};

export type PrototypeCreateLinkOperation = OperationMetadata & {
  kind: "prototype.createLink";
  payload: {
    link: PrototypeLink;
  };
};

export type PrototypeDeleteLinkOperation = OperationMetadata & {
  kind: "prototype.deleteLink";
  payload: {
    linkId: PrototypeLinkId;
  };
};

export type DesignOperation =
  | NodeCreateOperation
  | NodeUpdateGeometryOperation
  | NodeUpdateStyleOperation
  | NodeUpdateMetaOperation
  | NodeUpdateConstraintsOperation
  | NodeUpdateInstanceOverridesOperation
  | NodeReparentOperation
  | NodeReorderOperation
  | NodeDeleteOperation
  | NodeRestoreOperation
  | ComponentCreateOperation
  | ComponentDeleteOperation
  | CommentCreateOperation
  | CommentDeleteOperation
  | CommentAddMessageOperation
  | CommentRemoveMessageOperation
  | CommentSetResolvedOperation
  | SnapshotCreateOperation
  | SnapshotRestoreOperation
  | SnapshotDeleteOperation
  | PrototypeCreateLinkOperation
  | PrototypeDeleteLinkOperation;

export type Transaction = {
  id: string;
  label: string;
  operations: readonly DesignOperation[];
};
