import { AlignCenter, Grid3X3, Minus, Plus, RotateCcw, Ruler } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { defaultSnapSettings, defaultViewport, screenToDocument, snapMove, zoomAtPoint, type SnapGuide, type SnapSettings, type Viewport } from "../geometry";
import type { CommentId, CommentThread, NodeId, Point } from "../model";
import { SvgScene } from "../render";
import { clearSelection, selectOne, toggleSelection, type SelectionState } from "../selection";
import { commitTransaction, redo, undo, type HistoryState } from "../store";
import { createTransaction, type DesignOperation, type OperationMetadata } from "../ops";
import { createGroupTransaction, createLockTransaction, createMoveTransaction, createOrderingTransaction } from "../commands";
import { GuideOverlay, PresenceOverlay, SelectionOverlay } from "./overlays";
import { createNodeOperation, createToolIdFactory, type CreationTool } from "../tools";
import { CanvasContextMenu, type ContextMenuAction } from "../ui/contextMenu";
import { ShortcutHelp } from "../ui/shortcuts";
import { CommentPinsOverlay } from "../comments";
import type { PresenceState } from "../collab";

const canvasSize = {
  width: 1440,
  height: 960,
};

type DragState = {
  start: { x: number; y: number };
  selectedIds: readonly NodeId[];
  design: HistoryState["present"];
  lastDelta: { dx: number; dy: number };
  moved: boolean;
};

export function SvgCanvas({
  activeCommentId,
  commentFocusKey,
  commentMode,
  comments,
  history,
  activeTool,
  onBroadcastOperations,
  onActiveToolChange,
  onCreateComment,
  onCursorMove,
  onSelectComment,
  remotePresences,
  selection,
  setHistory,
  setSelection,
}: {
  activeCommentId: CommentId | null;
  commentFocusKey: number;
  commentMode: boolean;
  comments: readonly CommentThread[];
  history: HistoryState;
  activeTool: CreationTool | "Select";
  onBroadcastOperations: (operations: readonly DesignOperation[]) => void;
  onActiveToolChange: (tool: CreationTool | "Select") => void;
  onCreateComment: (point: Point, nodeId: NodeId) => void;
  onCursorMove: (point: Point) => void;
  onSelectComment: (commentId: CommentId) => void;
  remotePresences: readonly PresenceState[];
  selection: SelectionState;
  setHistory: React.Dispatch<React.SetStateAction<HistoryState>>;
  setSelection: React.Dispatch<React.SetStateAction<SelectionState>>;
}) {
  const [activeGuides, setActiveGuides] = useState<readonly SnapGuide[]>([]);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [snapSettings, setSnapSettings] = useState<SnapSettings>(defaultSnapSettings);
  const [shortcutHelpOpen, setShortcutHelpOpen] = useState(false);
  const [viewport, setViewport] = useState<Viewport>(defaultViewport);
  const clipboardNodeId = useRef<string | null>(null);
  const dragState = useRef<DragState | null>(null);
  const opCounter = useRef(0);
  const toolIds = useRef(createToolIdFactory("local-canvas"));
  const design = history.present;
  const viewBoxWidth = canvasSize.width / viewport.zoom;
  const viewBoxHeight = canvasSize.height / viewport.zoom;

  useEffect(() => {
    if (!activeCommentId || commentFocusKey === 0) {
      return;
    }

    const comment = comments.find((candidate) => candidate.id === activeCommentId);
    if (!comment) {
      return;
    }

    setViewport((current) => ({
      ...current,
      x: comment.position.x - canvasSize.width / current.zoom / 2,
      y: comment.position.y - canvasSize.height / current.zoom / 2,
    }));
  }, [activeCommentId, commentFocusKey, comments]);

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
      onBroadcastOperations(transaction.operations);
    }
  }

  function selectedNodeFromEvent(event: React.PointerEvent<SVGSVGElement>) {
    const target = event.target instanceof Element ? event.target.closest("[data-node-id]") : null;
    return target?.getAttribute("data-node-id");
  }

  function documentPointFromEvent(event: React.PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    return screenToDocument(
      {
        x: ((event.clientX - bounds.left) / bounds.width) * canvasSize.width,
        y: ((event.clientY - bounds.top) / bounds.height) * canvasSize.height,
      },
      viewport,
    );
  }

  function handlePointerDown(event: React.PointerEvent<SVGSVGElement>) {
    setActiveGuides([]);
    if (commentMode) {
      const point = documentPointFromEvent(event);
      const nodeId = (selectedNodeFromEvent(event) as NodeId | null) ?? design.rootIds[0];
      if (nodeId) {
        onCreateComment(point, nodeId);
      }
      return;
    }

    if (activeTool !== "Select") {
      const parentId = design.rootIds[0] ?? null;
      const operation = createNodeOperation(activeTool, documentPointFromEvent(event), parentId, toolIds.current, metadata("create"));
      commit(createTransaction("tx_create_node", `Create ${activeTool}`, [operation]));
      setSelection(selectOne(operation.payload.node.id));
      onActiveToolChange("Select");
      return;
    }

    const nodeId = selectedNodeFromEvent(event);
    if (!nodeId) {
      setSelection(clearSelection());
      return;
    }

    const nextSelection = event.shiftKey ? toggleSelection(selection, nodeId as NodeId) : selectOne(nodeId as NodeId);
    setSelection(nextSelection);
    dragState.current = {
      start: documentPointFromEvent(event),
      selectedIds: nextSelection.selectedIds,
      design,
      lastDelta: { dx: 0, dy: 0 },
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    onCursorMove(documentPointFromEvent(event));
    const drag = dragState.current;
    if (!drag) {
      return;
    }

    const point = documentPointFromEvent(event);
    const rawDelta = {
      dx: point.x - drag.start.x,
      dy: point.y - drag.start.y,
    };

    if (!drag.moved && Math.abs(rawDelta.dx) + Math.abs(rawDelta.dy) < 2) {
      return;
    }

    const snapped = snapMove(drag.design, drag.selectedIds, rawDelta, snapSettings);
    dragState.current = {
      ...drag,
      lastDelta: snapped.delta,
      moved: true,
    };
    setActiveGuides(snapped.guides);
  }

  function handlePointerUp(event: React.PointerEvent<SVGSVGElement>) {
    const drag = dragState.current;
    if (!drag) {
      return;
    }

    if (drag.moved) {
      commit(createMoveTransaction(drag.design, drag.selectedIds, drag.lastDelta, (index) => metadata("drag", index)));
    }
    dragState.current = null;
    setActiveGuides([]);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function nudge(dx: number, dy: number) {
    setActiveGuides([]);
    commit(createMoveTransaction(design, selection.selectedIds, { dx, dy }, (index) => metadata("nudge", index)));
  }

  function toggleSnapSetting(key: keyof Pick<SnapSettings, "grid" | "alignment" | "spacing">) {
    setSnapSettings((current) => ({ ...current, [key]: !current[key] }));
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
    } else if (event.key === "?") {
      event.preventDefault();
      setShortcutHelpOpen(true);
    }
  }

  function handleContextMenu(event: React.MouseEvent<SVGSVGElement>) {
    event.preventDefault();
    const nodeId = selectedNodeFromEvent(event as unknown as React.PointerEvent<SVGSVGElement>);
    if (nodeId) {
      setSelection(selectOne(nodeId as NodeId));
    }
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
  }

  function runContextAction(action: ContextMenuAction) {
    const activeId = selection.activeId;
    if (!activeId) return;

    if (action === "bring-forward") commit(createOrderingTransaction(design, activeId, "forward", metadata("order")));
    if (action === "send-backward") commit(createOrderingTransaction(design, activeId, "backward", metadata("order")));
    if (action === "bring-front") commit(createOrderingTransaction(design, activeId, "front", metadata("order")));
    if (action === "send-back") commit(createOrderingTransaction(design, activeId, "back", metadata("order")));
    if (action === "lock") {
      const node = design.nodes[activeId];
      if (node) commit(createLockTransaction(activeId, true, metadata("lock")));
    }
    if (action === "group") {
      const groupId = `group_${opCounter.current + 1}` as NodeId;
      commit(createGroupTransaction(design, selection.selectedIds, groupId, (index) => metadata("group", index)));
      setSelection(selectOne(groupId));
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
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onContextMenu={handleContextMenu}
        viewBox={`${viewport.x} ${viewport.y} ${viewBoxWidth} ${viewBoxHeight}`}
      >
        <SvgScene design={design} />
        <GuideOverlay guides={activeGuides} />
        <CommentPinsOverlay activeCommentId={activeCommentId} comments={comments} onSelectComment={onSelectComment} />
        <PresenceOverlay design={design} presences={remotePresences} />
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
      <SnapControls settings={snapSettings} onToggle={toggleSnapSetting} />
      <CanvasContextMenu onAction={runContextAction} onClose={() => setContextMenuPosition(null)} position={contextMenuPosition} />
      <ShortcutHelp onClose={() => setShortcutHelpOpen(false)} open={shortcutHelpOpen} />
    </div>
  );
}

function SnapControls({
  onToggle,
  settings,
}: {
  onToggle: (key: keyof Pick<SnapSettings, "grid" | "alignment" | "spacing">) => void;
  settings: SnapSettings;
}) {
  const controls = [
    { key: "grid", label: "Grid", icon: Grid3X3 },
    { key: "alignment", label: "Align", icon: AlignCenter },
    { key: "spacing", label: "Space", icon: Ruler },
  ] as const;

  return (
    <div className="absolute bottom-4 left-4 flex items-center gap-1 rounded border border-desk-line bg-white/95 p-1 shadow-panel" data-testid="snap-controls">
      {controls.map((control) => {
        const Icon = control.icon;
        return (
          <button
            aria-label={`${control.label} snapping`}
            aria-pressed={settings[control.key]}
            className={`flex h-8 min-w-16 items-center justify-center gap-1 rounded px-2 text-xs font-semibold ${
              settings[control.key] ? "bg-desk-ink text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
            key={control.key}
            onClick={() => onToggle(control.key)}
            title={`${control.label} snapping`}
            type="button"
          >
            <Icon size={13} aria-hidden="true" />
            {control.label}
          </button>
        );
      })}
    </div>
  );
}
