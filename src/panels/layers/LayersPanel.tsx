import { Eye, EyeOff, Lock, Unlock, Search } from "lucide-react";
import { useState } from "react";

import type { DesignFile, NodeId } from "../../model";
import type { SelectionState } from "../../selection";
import { flattenLayers } from "./layerTree";

export function LayersPanel({
  design,
  selection,
  onJumpToLayer,
  onReorder,
  onToggleLocked,
  onToggleVisible,
}: {
  design: DesignFile;
  selection: SelectionState;
  onJumpToLayer: (nodeId: NodeId) => void;
  onReorder: (nodeId: NodeId, direction: "up" | "down") => void;
  onToggleLocked: (nodeId: NodeId) => void;
  onToggleVisible: (nodeId: NodeId) => void;
}) {
  const [query, setQuery] = useState("");
  const [draggedId, setDraggedId] = useState<NodeId | null>(null);
  const rows = flattenLayers(design, query);

  return (
    <section className="flex min-h-0 flex-1 flex-col" data-testid="layers-panel">
      <label className="mx-3 mt-3 flex items-center gap-2 rounded border border-desk-line bg-white px-3 py-2 text-sm text-desk-muted">
        <Search size={15} aria-hidden="true" />
        <input
          className="w-full bg-transparent text-sm outline-none placeholder:text-desk-muted"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search layers"
          type="search"
          value={query}
        />
      </label>

      <div className="flex-1 overflow-auto px-2 py-3">
        {rows.map(({ node, depth }) => {
          const selected = selection.selectedIds.includes(node.id);
          return (
            <div
              className={`group flex items-center gap-1 rounded px-2 py-1.5 text-sm ${selected ? "bg-teal-50 text-teal-900" : "text-slate-700 hover:bg-slate-50"}`}
              data-layer-node-id={node.id}
              draggable
              key={node.id}
              onDragStart={() => setDraggedId(node.id)}
              onDrop={() => {
                if (draggedId && draggedId !== node.id) {
                  onReorder(draggedId, "up");
                }
                setDraggedId(null);
              }}
              onDragOver={(event) => event.preventDefault()}
              style={{ paddingLeft: `${8 + depth * 14}px` }}
            >
              <button className="min-w-0 flex-1 truncate text-left" onClick={() => onJumpToLayer(node.id)}>
                <span className="block truncate font-medium">{node.name}</span>
                <span className="block text-[11px] text-desk-muted">{node.kind}</span>
              </button>
              <button aria-label={`Toggle visibility ${node.name}`} className="flex size-7 items-center justify-center rounded hover:bg-white" onClick={() => onToggleVisible(node.id)}>
                {node.visible ? <Eye size={14} aria-hidden="true" /> : <EyeOff size={14} aria-hidden="true" />}
              </button>
              <button aria-label={`Toggle lock ${node.name}`} className="flex size-7 items-center justify-center rounded hover:bg-white" onClick={() => onToggleLocked(node.id)}>
                {node.locked ? <Lock size={14} aria-hidden="true" /> : <Unlock size={14} aria-hidden="true" />}
              </button>
              <button aria-label={`Move ${node.name} up`} className="hidden rounded px-1 text-xs group-hover:block" onClick={() => onReorder(node.id, "up")}>
                Up
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
