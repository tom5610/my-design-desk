import type { DesignFile } from "../model";
import { applyTransaction } from "../ops/apply";
import { invertTransaction } from "../ops/invert";
import type { Transaction } from "../ops/types";

export type HistoryEntry = {
  label: string;
  redo: Transaction;
  undo: Transaction;
};

export type HistoryState = {
  present: DesignFile;
  past: readonly HistoryEntry[];
  future: readonly HistoryEntry[];
};

export function createHistoryState(initialDesign: DesignFile): HistoryState {
  return {
    present: initialDesign,
    past: [],
    future: [],
  };
}

export function commitTransaction(history: HistoryState, transaction: Transaction): HistoryState {
  if (transaction.operations.length === 0) {
    return history;
  }

  const undo = invertTransaction(history.present, transaction);
  const present = applyTransaction(history.present, transaction);

  return {
    present,
    past: [
      ...history.past,
      {
        label: transaction.label,
        redo: transaction,
        undo,
      },
    ],
    future: [],
  };
}

export function undo(history: HistoryState): HistoryState {
  const entry = history.past.at(-1);
  if (!entry) {
    return history;
  }

  return {
    present: applyTransaction(history.present, entry.undo),
    past: history.past.slice(0, -1),
    future: [entry, ...history.future],
  };
}

export function redo(history: HistoryState): HistoryState {
  const [entry, ...future] = history.future;
  if (!entry) {
    return history;
  }

  return {
    present: applyTransaction(history.present, entry.redo),
    past: [...history.past, entry],
    future,
  };
}
