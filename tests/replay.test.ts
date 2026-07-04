import { describe, expect, it } from "vitest";

import { createStarterDesign } from "../src/demo";
import { branchHistoryFromReplay, replayLabels, replayToStep } from "../src/replay";
import { commitTransaction, createHistoryState } from "../src/store";
import type { DesignFile } from "../src/model";
import type { OperationMetadata, Transaction } from "../src/ops";
import { serializeDesign } from "../src/serialization";

function metadata(opId: string): OperationMetadata {
  return {
    opId,
    sessionId: "session_replay",
    clientId: "client_replay",
    actorId: "actor_replay",
    sequence: null,
    timestamp: "2026-07-04T11:00:00.000Z",
  };
}

function moveHeadline(design: DesignFile, x: number): Transaction {
  const headline = Object.values(design.nodes).find((node) => node.name === "Hero headline");
  if (!headline || !("geometry" in headline)) {
    throw new Error("Missing headline");
  }

  return {
    id: `tx_move_${x}`,
    label: `Move headline ${x}`,
    operations: [
      {
        ...metadata(`move_${x}`),
        kind: "node.updateGeometry",
        payload: {
          nodeId: headline.id,
          geometry: { ...headline.geometry, x },
        },
      },
    ],
  };
}

describe("deterministic replay", () => {
  it("reconstructs the same design as committed history", () => {
    const initial = createStarterDesign();
    const first = commitTransaction(createHistoryState(initial), moveHeadline(initial, 200));
    const second = commitTransaction(first, moveHeadline(first.present, 240));

    expect(serializeDesign(replayToStep(initial, second.past, 2))).toBe(serializeDesign(second.present));
    expect(replayLabels(second.past)).toEqual([
      { index: 1, label: "Move headline 200", opCount: 1 },
      { index: 2, label: "Move headline 240", opCount: 1 },
    ]);
  });

  it("branches a clean history from a replay step", () => {
    const initial = createStarterDesign();
    const first = commitTransaction(createHistoryState(initial), moveHeadline(initial, 200));
    const second = commitTransaction(first, moveHeadline(first.present, 240));
    const branch = branchHistoryFromReplay(initial, second.past, 1);

    expect(branch.past).toHaveLength(0);
    expect(serializeDesign(branch.present)).toBe(serializeDesign(replayToStep(initial, second.past, 1)));
  });
});
