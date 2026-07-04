import { describe, expect, it } from "vitest";

import { createStarterDesign } from "../src/demo";
import { measurePerformanceGuardrails } from "../src/performance";

describe("performance guardrails", () => {
  it("keeps the starter demo under interactive editor thresholds", () => {
    expect(measurePerformanceGuardrails(createStarterDesign())).toEqual({
      nodeCount: 15,
      operationCount: 0,
      rootCount: 2,
      warnings: [],
    });
  });
});
