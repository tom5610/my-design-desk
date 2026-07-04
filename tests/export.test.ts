import { describe, expect, it } from "vitest";
import ts from "typescript";

import { createStarterDesign } from "../src/demo";
import { collectExportAssets, generateExportFiles } from "../src/export";

describe("deterministic export codegen", () => {
  it("generates stable React/Tailwind package files", () => {
    const first = generateExportFiles(createStarterDesign());
    const second = generateExportFiles(createStarterDesign());

    expect(first).toEqual(second);
    expect(first.map((file) => file.path)).toEqual([...first.map((file) => file.path)].sort());
    expect(first.find((file) => file.path === "src/App.tsx")?.content).toContain("AIBuilderLandingPage");
    expect(first.find((file) => file.path === "src/components/PrimaryButton.tsx")?.content).toContain("export function PrimaryButton");
    expect(first.find((file) => file.path === "design.json")?.content).toContain('"prototypeLinks": {}');
    expect(first).toMatchSnapshot();
  });

  it("collects image assets into deterministic output paths", () => {
    expect(collectExportAssets(createStarterDesign())).toEqual([
      {
        outputPath: "public/assets/demo-preview-placeholder.svg",
        source: "/assets/demo-preview-placeholder.svg",
      },
    ]);
  });

  it("emits parseable TSX for generated components", () => {
    const files = generateExportFiles(createStarterDesign()).filter((file) => file.path.endsWith(".tsx"));

    for (const file of files) {
      const result = ts.transpileModule(file.content, {
        compilerOptions: {
          jsx: ts.JsxEmit.ReactJSX,
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
        },
        fileName: file.path,
        reportDiagnostics: true,
      });
      expect(result.diagnostics, file.path).toEqual([]);
    }
  });
});
