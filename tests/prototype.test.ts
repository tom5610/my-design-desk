import { describe, expect, it } from "vitest";

import { createStarterDesign } from "../src/demo";
import { createPrototypeLinkTransaction, findContainingFrameId, getPrototypeHotspots, navigatePrototype } from "../src/prototype";
import { createDeterministicIdFactory, type DesignFile } from "../src/model";
import { applyTransaction, type OperationMetadata } from "../src/ops";
import { serializeDesign } from "../src/serialization";

function metadata(opId: string): OperationMetadata {
  return {
    opId,
    sessionId: "session_prototype",
    clientId: "client_prototype",
    actorId: "actor_prototype",
    sequence: null,
    timestamp: "2026-07-04T12:00:00.000Z",
  };
}

function nodeByName(design: DesignFile, name: string) {
  const node = Object.values(design.nodes).find((candidate) => candidate.name === name);
  if (!node) {
    throw new Error(`Missing node ${name}`);
  }
  return node;
}

describe("prototype links", () => {
  it("serializes and navigates deterministic on-click links", () => {
    const design = createStarterDesign();
    const ids = createDeterministicIdFactory("prototype-test");
    const button = nodeByName(design, "Start editing button");
    const sourceFrame = nodeByName(design, "AI Builder landing page");
    const targetFrame = nodeByName(design, "AI Builder dashboard frame");
    const transaction = createPrototypeLinkTransaction(ids.prototype("cta"), button.id, targetFrame.id, metadata("link"));
    const linked = applyTransaction(design, transaction);

    expect(findContainingFrameId(linked, button.id)).toBe(sourceFrame.id);
    expect(navigatePrototype(linked, button.id)).toBe(targetFrame.id);
    expect(getPrototypeHotspots(linked, sourceFrame.id)).toHaveLength(1);
    expect(Object.values(linked.prototypeLinks)[0]).toMatchObject({ fromNodeId: button.id, toNodeId: targetFrame.id, trigger: "click" });
    expect(serializeDesign(linked)).toBe(serializeDesign(applyTransaction(createStarterDesign(), transaction)));
  });
});
