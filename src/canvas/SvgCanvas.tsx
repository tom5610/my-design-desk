import { Minus, Plus, RotateCcw } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { createStarterDesign } from "../demo";
import { defaultViewport, zoomAtPoint, type Viewport } from "../geometry";
import type { NodeId } from "../model";
import { SvgScene } from "../render";
import { clearSelection, emptySelection, selectOne, toggleSelection, type SelectionState } from "../selection";
import { commitTransaction, createHistoryState, redo, undo, type HistoryState } from "../store";
import { createTransaction, type DesignOperation, type OperationMetadata } from "../ops";
import { createMoveTransaction } from "../commands";
import { SelectionOverlay } from "./overlays";

const canvasSize = {
  width: 1440,
  height: 960,
};

export function SvgCanvas() {
  const initialDesign = useMemo(() => createStarterDesign(), []);
  const [history, setHistory] = useState<HistoryState>(() => createHistoryState(initialDesign));
  const [selection, setSelection] = useState<SelectionState>(emptySelection);
  const [viewport, setViewport] = useState<Viewport>(defaultViewport);
  const clipboardNodeId = useRef<string | null>(null);
  const opCounter = useRef(0);
  const design = history.present;
  const viewBoxWidth = canvasSize.width / viewport.zoom;
  const viewBoxHeight = canvasSize.height / viewport.zoom;

  function zoom(multiplier: number) {
    setViewport((current) => zoomAtPoint(current, { x: canvasSize.width / 2, y: canvasSize.height / 2 }, current.zoom * multiplier));
  }

  function metadata(kind: string, index = 0): OperationMetadata {
    opCounter.current += 1;
    return {
      opId: `local_${kind}_${opCounter.current}_${index}`,
      sessionId: "local-demo",
      clientId: "local-client",
      actorId: "local-user",
      sequence: null,
      timestamp: "2026-07-04T03:00:00.000Z",
    };
  }

  function commit(transaction: ReturnType<typeof createTransaction>) {
    if (transaction.operations.length > 0) {
      setHistory((current) => commitTransaction(current, transaction));
    }
  }

  function selectedNodeFromEvent(event: React.PointerEvent<SVGSVGElement>) {
    const target = event.target instanceof Element ? event.target.closest("[data-node-id]") : null;
    return target?.getAttribute("data-node-id");
  }

  function handlePointerDown(event: React.PointerEvent<SVGSVGElement>) {
    const nodeId = selectedNodeFromEvent(event);
    if (!nodeId) {
      setSelection(clearSelection());
      return;
    }

    setSelection((current) => (event.shiftKey ? toggleSelection(current, nodeId as NodeId) : selectOne(nodeId as NodeId)));
  }

  function nudge(dx: number, dy: number) {
    commit(createMoveTransaction(design, selection.selectedIds, { dx, dy }, (index) => metadata("nudge", index)));
  }

  function deleteSelection() {
    const operations: DesignOperation[] = selection.selectedIds.map((nodeId, index) => ({
      ...metadata("delete", index),
      kind: "node.delete",
      payload: { nodeId },
    }));
    commit(createTransaction("tx_delete_selection", "Delete selection", operations));
    setSelection(clearSelection());
  }

  function duplicateSelection() {
    const operations: DesignOperation[] = selection.selectedIds.flatMap((nodeId, index) => {
      const node = design.nodes[nodeId];
      if (!node || !("geometry" in node)) {
        return [];
      }
      const nextId = `${node.id}_copy_${opCounter.current + index + 1}` as typeof node.id;
      const clonedNode = "children" in node
        ? {
            ...node,
            id: nextId,
            name: `${node.name} copy`,
            geometry: { ...node.geometry, x: node.geometry.x + 24, y: node.geometry.y + 24 },
            children: [],
          }
        : {
            ...node,
            id: nextId,
            name: `${node.name} copy`,
            geometry: { ...node.geometry, x: node.geometry.x + 24, y: node.geometry.y + 24 },
          };
      return [
        {
          ...metadata("duplicate", index),
          kind: "node.create" as const,
          payload: {
            node: clonedNode,
          },
        },
      ];
    });
    commit(createTransaction("tx_duplicate_selection", "Duplicate selection", operations));
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const modifier = event.metaKey || event.ctrlKey;
    const step = event.shiftKey ? 10 : 1;

    if (event.key === "ArrowRight") {
      event.preventDefault();
      nudge(step, 0);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      nudge(-step, 0);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      nudge(0, step);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      nudge(0, -step);
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      deleteSelection();
    } else if (modifier && event.key.toLowerCase() === "z" && event.shiftKey) {
      event.preventDefault();
      setHistory((current) => redo(current));
    } else if (modifier && event.key.toLowerCase() === "z") {
      event.preventDefault();
      setHistory((current) => undo(current));
    } else if (modifier && event.key.toLowerCase() === "d") {
      event.preventDefault();
      duplicateSelection();
    } else if (modifier && event.key.toLowerCase() === "c") {
      event.preventDefault();
      clipboardNodeId.current = selection.activeId;
    } else if (modifier && event.key.toLowerCase() === "v" && clipboardNodeId.current) {
      event.preventDefault();
      duplicateSelection();
    }
  }

  return (
    <div className="absolute inset-0 outline-none" data-testid="svg-canvas" onKeyDown={handleKeyDown} tabIndex={0}>
      <svg
        aria-label="Design canvas"
        className="size-full"
        data-testid="scene-svg"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        onPointerDown={handlePointerDown}
        viewBox={`${viewport.x} ${viewport.y} ${viewBoxWidth} ${viewBoxHeight}`}
      >
        <SvgScene design={design} />
        <SelectionOverlay design={design} selectedIds={selection.selectedIds} />
      </svg>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded border border-desk-line bg-white/95 p-1 shadow-panel">
        <button aria-label="Zoom out" className="flex size-8 items-center justify-center rounded hover:bg-slate-100" onClick={() => zoom(0.85)}>
          <Minus size={15} aria-hidden="true" />
        </button>
        <span className="w-14 text-center text-xs font-semibold">{Math.round(viewport.zoom * 100)}%</span>
        <button aria-label="Zoom in" className="flex size-8 items-center justify-center rounded hover:bg-slate-100" onClick={() => zoom(1.18)}>
          <Plus size={15} aria-hidden="true" />
        </button>
        <button aria-label="Reset zoom" className="flex size-8 items-center justify-center rounded hover:bg-slate-100" onClick={() => setViewport(defaultViewport)}>
          <RotateCcw size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
