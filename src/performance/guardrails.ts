import type { DesignFile } from "../model";

export type PerformanceGuardrailReport = {
  nodeCount: number;
  rootCount: number;
  operationCount: number;
  warnings: readonly string[];
};

export function measurePerformanceGuardrails(design: DesignFile): PerformanceGuardrailReport {
  const nodeCount = Object.keys(design.nodes).length;
  const rootCount = design.rootIds.length;
  const operationCount = design.ops.length;
  const warnings: string[] = [];

  if (nodeCount > 500) {
    warnings.push(`High node count: ${nodeCount}`);
  }
  if (rootCount > 12) {
    warnings.push(`High root frame count: ${rootCount}`);
  }
  if (operationCount > 2000) {
    warnings.push(`High operation journal length: ${operationCount}`);
  }

  return {
    nodeCount,
    rootCount,
    operationCount,
    warnings,
  };
}
