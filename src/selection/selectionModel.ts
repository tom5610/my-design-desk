import type { NodeId } from "../model";

export type SelectionState = {
  selectedIds: readonly NodeId[];
  activeId: NodeId | null;
};

export const emptySelection: SelectionState = {
  selectedIds: [],
  activeId: null,
};

export function selectOne(nodeId: NodeId): SelectionState {
  return {
    selectedIds: [nodeId],
    activeId: nodeId,
  };
}

export function toggleSelection(selection: SelectionState, nodeId: NodeId): SelectionState {
  if (selection.selectedIds.includes(nodeId)) {
    const selectedIds = selection.selectedIds.filter((selectedId) => selectedId !== nodeId);
    return {
      selectedIds,
      activeId: selection.activeId === nodeId ? (selectedIds.at(-1) ?? null) : selection.activeId,
    };
  }

  return {
    selectedIds: [...selection.selectedIds, nodeId],
    activeId: nodeId,
  };
}

export function clearSelection(): SelectionState {
  return emptySelection;
}
