import { describe, expect, it } from "vitest";

import { createStarterDesign } from "../src/demo";
import {
  createComponentFromSelectionTransaction,
  createDetachInstanceTransaction,
  createUpdateInstanceOverridesTransaction,
} from "../src/commands";
import {
  createDeterministicIdFactory,
  resolveComponentInstance,
  type DesignFile,
  type SceneNode,
} from "../src/model";
import { applyOperations, type OperationMetadata } from "../src/ops";
import { serializeDesign } from "../src/serialization";

function metadata(opId: string): OperationMetadata {
  return {
    opId,
    sessionId: "session_component",
    clientId: "client_component",
    actorId: "actor_component",
    sequence: null,
    timestamp: "2026-07-04T08:00:00.000Z",
  };
}

function metadataAt(prefix: string) {
  return (index: number) => metadata(`${prefix}_${index}`);
}

function nodeByName(design: DesignFile, name: string): SceneNode {
  const node = Object.values(design.nodes).find((candidate) => candidate.name === name);
  if (!node) {
    throw new Error(`Missing node ${name}`);
  }
  return node;
}

function solidFill(node: SceneNode) {
  if (!("style" in node)) {
    throw new Error(`Node ${node.id} has no style`);
  }
  const fill = node.style.fills.find((candidate) => candidate.kind === "solid");
  return fill?.kind === "solid" ? fill.color : null;
}

describe("component system", () => {
  it("renders instances from the master while preserving text and fill overrides", () => {
    const initial = createStarterDesign();
    const instance = nodeByName(initial, "Secondary CTA instance");
    const master = nodeByName(initial, "Primary button master");
    if (instance.kind !== "ComponentInstance" || master.kind !== "Button") {
      throw new Error("Starter component nodes are malformed");
    }

    const updatedMaster = applyOperations(initial, [
      {
        ...metadata("master_fill"),
        kind: "node.updateStyle",
        payload: {
          nodeId: master.id,
          style: { ...master.style, fills: [{ kind: "solid", color: "#0f766e" }] },
        },
      },
    ]);
    const inherited = resolveComponentInstance(updatedMaster, updatedMaster.nodes[instance.id] as typeof instance);
    const inheritedButton = inherited?.childIds[0] ? inherited.nodes[inherited.childIds[0]] : null;

    expect(inheritedButton?.kind).toBe("Button");
    expect(inheritedButton && "label" in inheritedButton ? inheritedButton.label : null).toBe("View replay");
    expect(inheritedButton ? solidFill(inheritedButton) : null).toBe("#0f766e");

    const overridden = applyOperations(
      updatedMaster,
      createUpdateInstanceOverridesTransaction(instance.id, { label: "Open replay", text: "Open replay", fill: "#2563eb" }, metadata("override")).operations,
    );
    const overriddenTree = resolveComponentInstance(overridden, overridden.nodes[instance.id] as typeof instance);
    const overriddenButton = overriddenTree?.childIds[0] ? overriddenTree.nodes[overriddenTree.childIds[0]] : null;

    expect(overriddenButton && "label" in overriddenButton ? overriddenButton.label : null).toBe("Open replay");
    expect(overriddenButton ? solidFill(overriddenButton) : null).toBe("#2563eb");
  });

  it("creates components from selection as replayable serialized operations", () => {
    const initial = createStarterDesign();
    const ids = createDeterministicIdFactory("component-test");
    const button = nodeByName(initial, "Start editing button");
    const componentId = ids.component("cta");
    const rootId = ids.node("cta-root");
    const instanceId = ids.node("cta-instance");
    const transaction = createComponentFromSelectionTransaction(initial, [button.id], componentId, rootId, instanceId, metadataAt("create_component"));
    const replayed = applyOperations(initial, transaction.operations);

    expect(replayed.components[componentId]?.rootNodeId).toBe(rootId);
    expect(replayed.nodes[button.id]?.parentId).toBe(rootId);
    expect(replayed.nodes[instanceId]?.kind).toBe("ComponentInstance");
    expect(serializeDesign(replayed)).toBe(serializeDesign(applyOperations(createStarterDesign(), transaction.operations)));
  });

  it("detaches instances into normal nodes", () => {
    const initial = createStarterDesign();
    const ids = createDeterministicIdFactory("detach-test");
    const instance = nodeByName(initial, "Secondary CTA instance");
    const transaction = createDetachInstanceTransaction(initial, instance.id, (hint) => ids.node(hint), metadataAt("detach"));
    const detached = applyOperations(initial, transaction.operations);
    const created = transaction.operations.find((operation) => operation.kind === "node.create")?.payload.node;

    expect(detached.nodes[instance.id]).toBeUndefined();
    expect(created?.kind).toBe("Button");
    expect(created && "label" in created ? created.label : null).toBe("View replay");
    expect(created ? solidFill(created) : null).toBe("#111827");
    expect(serializeDesign(detached)).toBe(serializeDesign(applyOperations(createStarterDesign(), transaction.operations)));
  });
});
