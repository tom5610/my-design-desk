import type { DesignFile } from "../model";
import { applyTransaction } from "../ops";
import { createHistoryState, type HistoryEntry, type HistoryState } from "../store";

export function replayToStep(initialDesign: DesignFile, entries: readonly HistoryEntry[], step: number): DesignFile {
  const boundedStep = Math.max(0, Math.min(step, entries.length));
  return entries.slice(0, boundedStep).reduce((design, entry) => applyTransaction(design, entry.redo), initialDesign);
}

export function replayLabels(entries: readonly HistoryEntry[]) {
  return entries.map((entry, index) => ({
    index: index + 1,
    label: entry.label,
    opCount: entry.redo.operations.length,
  }));
}

export function branchHistoryFromReplay(initialDesign: DesignFile, entries: readonly HistoryEntry[], step: number): HistoryState {
  return createHistoryState(replayToStep(initialDesign, entries, step));
}
