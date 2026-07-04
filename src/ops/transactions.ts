import type { DesignOperation, Transaction } from "./types";

export function createTransaction(id: string, label: string, operations: readonly DesignOperation[]): Transaction {
  return {
    id,
    label,
    operations,
  };
}
