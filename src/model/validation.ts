import type { NodeId } from "./ids";
import type { ComponentRootNode, DesignFile, SceneNode } from "./scene";

export type ValidationResult = {
  valid: boolean;
  errors: readonly string[];
};

type SceneContainerNode = Extract<SceneNode, { children: readonly NodeId[] }>;

function isContainerNode(node: SceneNode): node is SceneContainerNode {
  return "children" in node;
}

function isComponentRootNode(node: SceneNode): node is ComponentRootNode {
  return node.kind === "ComponentRoot";
}

export function validateDesign(design: DesignFile): ValidationResult {
  const errors: string[] = [];
  const seenRootIds = new Set<NodeId>();

  for (const rootId of design.rootIds) {
    if (seenRootIds.has(rootId)) {
      errors.push(`Duplicate root id: ${rootId}`);
    }
    seenRootIds.add(rootId);

    const root = design.nodes[rootId];
    if (!root) {
      errors.push(`Missing root node: ${rootId}`);
    } else if (root.parentId !== null) {
      errors.push(`Root node must not have a parent: ${rootId}`);
    }
  }

  for (const [nodeId, node] of Object.entries(design.nodes) as [NodeId, SceneNode][]) {
    if (node.id !== nodeId) {
      errors.push(`Node key does not match node id: ${nodeId}`);
    }

    if (node.parentId !== null) {
      const parent = design.nodes[node.parentId];
      if (!parent) {
        errors.push(`Node ${nodeId} references missing parent ${node.parentId}`);
      } else if (!isContainerNode(parent)) {
        errors.push(`Node ${nodeId} references non-container parent ${node.parentId}`);
      } else if (!parent.children.includes(node.id)) {
        errors.push(`Parent ${node.parentId} does not include child ${nodeId}`);
      }
    }

    if (isContainerNode(node)) {
      const seenChildren = new Set<NodeId>();
      for (const childId of node.children) {
        if (seenChildren.has(childId)) {
          errors.push(`Duplicate child ${childId} in ${nodeId}`);
        }
        seenChildren.add(childId);

        const child = design.nodes[childId];
        if (!child) {
          errors.push(`Container ${nodeId} references missing child ${childId}`);
        } else if (child.parentId !== node.id) {
          errors.push(`Child ${childId} does not point back to parent ${nodeId}`);
        }
      }
    }

    if (isComponentRootNode(node) && !design.components[node.componentId]) {
      errors.push(`Component root ${nodeId} references missing component ${node.componentId}`);
    }

    if (node.kind === "ComponentInstance" && !design.components[node.componentId]) {
      errors.push(`Component instance ${nodeId} references missing component ${node.componentId}`);
    }
  }

  for (const [componentId, component] of Object.entries(design.components)) {
    if (component.id !== componentId) {
      errors.push(`Component key does not match component id: ${componentId}`);
    }

    const rootNode = design.nodes[component.rootNodeId];
    if (!rootNode) {
      errors.push(`Component ${componentId} references missing root ${component.rootNodeId}`);
    } else if (!isComponentRootNode(rootNode)) {
      errors.push(`Component ${componentId} root is not a ComponentRoot node`);
    } else if (rootNode.componentId !== component.id) {
      errors.push(`Component ${componentId} root points at ${rootNode.componentId}`);
    }
  }

  for (const [commentId, comment] of Object.entries(design.comments)) {
    if (comment.id !== commentId) {
      errors.push(`Comment key does not match comment id: ${commentId}`);
    }

    if (!design.nodes[comment.nodeId]) {
      errors.push(`Comment ${commentId} references missing node ${comment.nodeId}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function assertValidDesign(design: DesignFile): asserts design is DesignFile {
  const result = validateDesign(design);
  if (!result.valid) {
    throw new Error(`Invalid design file:\n${result.errors.join("\n")}`);
  }
}
