import { describe, expect, it } from "vitest";

import packageJson from "../package.json";

describe("Milestone 2 scaffold", () => {
  it("exposes the required project scripts", () => {
    expect(Object.keys(packageJson.scripts).sort()).toEqual([
      "build",
      "dev",
      "export",
      "lint",
      "test",
      "typecheck",
    ]);
  });
});
