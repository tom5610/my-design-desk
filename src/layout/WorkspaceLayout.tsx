import {
  Circle,
  Component,
  Eye,
  History,
  Layers,
  MessageSquare,
  MousePointer2,
  Play,
  RectangleHorizontal,
  Share2,
  Sparkles,
  Square,
  Type,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { DemoProjectPicker } from "../ui/DemoProjectPicker";
import { ModalShell } from "../ui/ModalShell";
import { ToastStack } from "../ui/ToastStack";
import { SvgCanvas } from "../canvas";
import { createStarterDesign } from "../demo";
import { createDeterministicIdFactory, type CommentId, type CommentThread, type ComponentId, type ComponentOverrides, type DesignFile, type NodeId, type Point, type SnapshotId } from "../model";
import { createLayerMetaTransaction, createReorderTransaction, LayersPanel } from "../panels/layers";
import { AssetsPanel } from "../panels/assets";
import { InspectorPanel } from "../panels/inspector";
import { selectOne, type SelectionState, emptySelection } from "../selection";
import { commitTransaction, createHistoryState, type HistoryState } from "../store";
import { applyOperation, createTransaction, type DesignOperation, type OperationMetadata } from "../ops";
import {
  createCommentReplyTransaction,
  createCommentResolvedTransaction,
  createCommentThreadTransaction,
  createComponentFromSelectionTransaction,
  createDetachInstanceTransaction,
  createInsertInstanceTransaction,
  createUpdateInstanceOverridesTransaction,
} from "../commands";
import { CommentsPanel } from "../comments";
import { connectCollaborationClient, type CollaborationClient, type PresenceState } from "../collab";
import { createRestoreSnapshotTransaction, createSnapshotTransaction, VersionHistoryPanel } from "../history";
import { branchHistoryFromReplay, ReplayPanel } from "../replay";
import { createPrototypeLinkTransaction, findContainingFrameId, navigatePrototype, PrototypePanel } from "../prototype";
import { PreviewOverlay } from "../preview";
import type { CreationTool } from "../tools";

type CanvasTool = CreationTool | "Select";
type AdvancedPanel = "comments" | "history" | "replay";

const tools: { label: CanvasTool; icon: typeof MousePointer2 }[] = [
  { label: "Select", icon: MousePointer2 },
  { label: "Frame", icon: Square },
  { label: "Rectangle", icon: RectangleHorizontal },
  { label: "Ellipse", icon: Circle },
  { label: "Text", icon: Type },
  { label: "Button", icon: RectangleHorizontal },
];

const moreTools: CreationTool[] = ["Group", "Line", "Image", "Icon", "ChartPlaceholder"];

export function WorkspaceLayout() {
  const initialDesign = useMemo(() => createStarterDesign(), []);
  const sessionId = useMemo(() => new URLSearchParams(window.location.search).get("sessionId") ?? "local-demo", []);
  const actor = useMemo(
    () => ({
      id: `actor-${Math.random().toString(36).slice(2, 8)}`,
      name: `Local ${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
      color: "#db2777",
    }),
    [],
  );
  const clientId = useMemo(() => `client-${Math.random().toString(36).slice(2, 10)}`, []);
  const [history, setHistory] = useState<HistoryState>(() => createHistoryState(initialDesign));
  const [activeCommentId, setActiveCommentId] = useState<CommentId | null>(null);
  const [commentAuthor, setCommentAuthor] = useState("Local reviewer");
  const [commentFocusKey, setCommentFocusKey] = useState(0);
  const [commentMode, setCommentMode] = useState(false);
  const [collabStatus, setCollabStatus] = useState<"connecting" | "connected" | "offline">("connecting");
  const [lastSequence, setLastSequence] = useState(0);
  const [presenceByClient, setPresenceByClient] = useState<Record<string, PresenceState>>({});
  const [previewBackStack, setPreviewBackStack] = useState<NodeId[]>([]);
  const [previewNodeId, setPreviewNodeId] = useState<NodeId | null>(null);
  const [activePanel, setActivePanel] = useState<AdvancedPanel | null>(null);
  const [activeTool, setActiveTool] = useState<CanvasTool>("Select");
  const [selection, setSelection] = useState<SelectionState>(emptySelection);
  const [leftTab, setLeftTab] = useState<"layers" | "assets">("layers");
  const opCounter = useRef(0);
  const commentIds = useRef(createDeterministicIdFactory("workspace-comments"));
  const componentIds = useRef(createDeterministicIdFactory("workspace-components"));
  const snapshotIds = useRef(createDeterministicIdFactory("workspace-snapshots"));
  const prototypeIds = useRef(createDeterministicIdFactory("workspace-prototype"));
  const collaborationClient = useRef<CollaborationClient | null>(null);
  const broadcastChannel = useRef<BroadcastChannel | null>(null);
  const cursorPosition = useRef<Point | undefined>(undefined);
  const localBroadcastSequence = useRef(0);
  const pendingOperationIds = useRef(new Set<string>());
  const design = history.present;
  const comments = Object.values(design.comments).sort((left, right) => left.id.localeCompare(right.id));
  const remotePresences = Object.values(presenceByClient).filter((presence) => presence.clientId !== clientId);

  useEffect(() => {
    const channel = new BroadcastChannel(`design-desk:${sessionId}`);
    broadcastChannel.current = channel;
    setCollabStatus("connected");

    channel.onmessage = (event: MessageEvent<{ type: "operation"; operation: DesignOperation & { sequence: number } } | { type: "presence"; presence: PresenceState }>) => {
      const message = event.data;
      if (message.type === "presence") {
        setPresenceByClient((current) => ({ ...current, [message.presence.clientId]: message.presence }));
        return;
      }

      if (pendingOperationIds.current.has(message.operation.opId)) {
        return;
      }
      setLastSequence((current) => Math.max(current, message.operation.sequence));
      setHistory((current) => ({
        ...current,
        present: applyOperation(current.present, message.operation),
        future: [],
      }));
    };

    return () => {
      broadcastChannel.current = null;
      channel.close();
    };
  }, [sessionId]);

  useEffect(() => {
    const client = connectCollaborationClient(
      `ws://127.0.0.1:8787/collaboration?sessionId=${encodeURIComponent(sessionId)}`,
      (message) => {
        if (message.type === "server.ready") {
          setLastSequence(message.nextSequence - 1);
        } else if (message.type === "presence.joined" || message.type === "presence.updated") {
          setPresenceByClient((current) => ({ ...current, [message.presence.clientId]: message.presence }));
        } else if (message.type === "presence.left") {
          setPresenceByClient((current) => {
            const next = { ...current };
            delete next[message.clientId];
            return next;
          });
        } else if (message.type === "operation.committed") {
          setLastSequence(message.operation.sequence);
          if (pendingOperationIds.current.delete(message.operation.opId)) {
            return;
          }
          setHistory((current) => ({
            ...current,
            present: applyOperation(current.present, message.operation),
            future: [],
          }));
        }
      },
      {
        onClose: () => setCollabStatus(broadcastChannel.current ? "connected" : "offline"),
        onError: () => setCollabStatus(broadcastChannel.current ? "connected" : "offline"),
        onOpen: () => {
          setCollabStatus("connected");
          client.send({
            type: "presence.hello",
            sessionId,
            clientId,
            actor,
          });
        },
      },
    );
    collaborationClient.current = client;

    return () => {
      collaborationClient.current = null;
      client.close();
    };
  }, [actor, clientId, sessionId]);

  useEffect(() => {
    sendPresenceUpdate();
  }, [selection.selectedIds]);

  useEffect(() => {
    const interval = window.setInterval(() => sendPresenceUpdate(), 500);
    return () => window.clearInterval(interval);
  }, [selection.selectedIds]);

  useEffect(() => {
    if (!activePanel) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeActivePanel();
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [activePanel]);

  function metadata(kind: string, index = 0): OperationMetadata {
    opCounter.current += 1;
    return {
      opId: `workspace_${kind}_${opCounter.current}_${index}`,
      sessionId: "local-demo",
      clientId: "local-client",
      actorId: "local-user",
      sequence: null,
      timestamp: "2026-07-04T06:00:00.000Z",
    };
  }

  function commit(transaction: Parameters<typeof commitTransaction>[1]) {
    if (transaction.operations.length > 0) {
      setHistory((current) => commitTransaction(current, transaction));
      broadcastOperations(transaction.operations);
    }
  }

  function broadcastOperations(operations: readonly DesignOperation[]) {
    for (const operation of operations) {
      pendingOperationIds.current.add(operation.opId);
      collaborationClient.current?.send({
        type: "operation.submit",
        sessionId,
        clientId,
        operation,
      });
      localBroadcastSequence.current += 1;
      broadcastChannel.current?.postMessage({
        type: "operation",
        operation: {
          ...operation,
          sequence: localBroadcastSequence.current,
        },
      });
    }
  }

  function sendPresenceUpdate(cursor = cursorPosition.current) {
    const presence: PresenceState = {
      clientId,
      actor,
      cursor,
      selectedIds: selection.selectedIds,
    };
    broadcastChannel.current?.postMessage({ type: "presence", presence });
    collaborationClient.current?.send({
      type: "presence.update",
      sessionId,
      clientId,
      cursor,
      selectedIds: selection.selectedIds,
    });
  }

  function updateCursor(point: Point) {
    cursorPosition.current = point;
    sendPresenceUpdate(point);
  }

  function createComponentFromSelection() {
    const componentId = componentIds.current.component("component");
    const rootNodeId = componentIds.current.node("component-root");
    const instanceId = componentIds.current.node("component-instance");
    const transaction = createComponentFromSelectionTransaction(design, selection.selectedIds, componentId, rootNodeId, instanceId, (index) =>
      metadata("component", index),
    );
    commit(transaction);
    if (transaction.operations.length > 0) {
      setSelection(selectOne(instanceId));
      setLeftTab("assets");
    }
  }

  function insertComponentInstance(componentId: ComponentId) {
    const instanceId = componentIds.current.node("component-instance");
    const transaction = createInsertInstanceTransaction(design, componentId, instanceId, metadata("component-insert"));
    commit(transaction);
    if (transaction.operations.length > 0) {
      setSelection(selectOne(instanceId));
    }
  }

  function goToMainComponent(componentId: ComponentId) {
    const component = design.components[componentId];
    if (component) {
      setSelection(selectOne(component.rootNodeId));
      setLeftTab("layers");
    }
  }

  function goToMainFromInstance(nodeId: NodeId) {
    const node = design.nodes[nodeId];
    if (node?.kind === "ComponentInstance") {
      goToMainComponent(node.componentId);
    }
  }

  function detachInstance(nodeId: NodeId) {
    const transaction = createDetachInstanceTransaction(design, nodeId, (hint) => componentIds.current.node(hint), (index) => metadata("component-detach", index));
    const createdNodeId = transaction.operations.find((operation) => operation.kind === "node.create")?.payload.node.id;
    commit(transaction);
    setSelection(createdNodeId ? selectOne(createdNodeId) : emptySelection);
  }

  function updateInstanceOverrides(nodeId: NodeId, overrides: ComponentOverrides) {
    commit(createUpdateInstanceOverridesTransaction(nodeId, overrides, metadata("component-override")));
  }

  function createComment(point: Point, nodeId: NodeId) {
    const commentId = commentIds.current.comment("pin");
    const messageId = `${commentId}_message_${comments.length + 1}`;
    commit(
      createCommentThreadTransaction({
        author: commentAuthor || "Local reviewer",
        body: "Review this area",
        commentId,
        createdAt: "2026-07-04T09:00:00.000Z",
        messageId,
        metadata: metadata("comment-create"),
        nodeId,
        position: point,
      }),
    );
    setActiveCommentId(commentId);
    setCommentMode(false);
    setActivePanel("comments");
  }

  function replyToComment(commentId: CommentId, body: string) {
    const messageId = `${commentId}_reply_${opCounter.current + 1}`;
    commit(
      createCommentReplyTransaction({
        author: commentAuthor || "Local reviewer",
        body,
        commentId,
        createdAt: "2026-07-04T09:00:00.000Z",
        messageId,
        metadata: metadata("comment-reply"),
      }),
    );
  }

  function setCommentResolved(commentId: CommentId, resolved: boolean) {
    commit(createCommentResolvedTransaction(commentId, resolved, metadata("comment-resolve")));
  }

  function jumpToComment(commentId: CommentId) {
    setActiveCommentId(commentId);
    setCommentFocusKey((current) => current + 1);
  }

  function createNamedSnapshot(name: string) {
    const snapshotId = snapshotIds.current.snapshot(name);
    commit(createSnapshotTransaction(design, snapshotId, name, "2026-07-04T10:00:00.000Z", metadata("snapshot-create")));
  }

  function restoreSnapshot(snapshotId: SnapshotId) {
    const beforeSnapshotId = snapshotIds.current.snapshot("before-restore");
    commit(createRestoreSnapshotTransaction(design, snapshotId, beforeSnapshotId, "2026-07-04T10:00:00.000Z", (index) => metadata("snapshot-restore", index)));
  }

  function branchFromReplay(step: number) {
    setHistory(branchHistoryFromReplay(initialDesign, history.past, step));
    setSelection(emptySelection);
  }

  function createPrototypeLink(targetId: NodeId) {
    if (!selection.activeId) {
      return;
    }
    commit(createPrototypeLinkTransaction(prototypeIds.current.prototype("link"), selection.activeId, targetId, metadata("prototype-link")));
  }

  function startPrototypePreview(sourceId: NodeId) {
    const frameId = findContainingFrameId(design, sourceId);
    if (!frameId) {
      return;
    }
    setPreviewBackStack([]);
    setPreviewNodeId(frameId);
  }

  function previewNavigate(sourceId: NodeId) {
    const targetId = navigatePrototype(design, sourceId);
    if (!targetId) {
      return;
    }
    setPreviewBackStack((current) => (previewNodeId ? [...current, previewNodeId] : current));
    setPreviewNodeId(targetId);
  }

  function previewBack() {
    setPreviewBackStack((current) => {
      const previous = current.at(-1) ?? null;
      setPreviewNodeId(previous);
      return current.slice(0, -1);
    });
  }

  function closeActivePanel() {
    setActivePanel(null);
    setCommentMode(false);
  }

  function togglePanel(panel: AdvancedPanel) {
    setCommentMode(false);
    setActivePanel((current) => (current === panel ? null : panel));
  }

  function toggleCommentMode() {
    setCommentMode((current) => {
      if (current) {
        setActivePanel(null);
        return false;
      }
      setActivePanel("comments");
      return true;
    });
  }

  return (
    <main
      className="flex h-dvh min-h-[680px] flex-col overflow-hidden bg-desk-canvas text-desk-ink lg:flex-row"
      data-testid="workspace-shell"
    >
      <LeftPanel
        design={design}
        leftTab={leftTab}
        onReorder={(nodeId, direction) => commit(createReorderTransaction(design, nodeId, direction, metadata("reorder")))}
        onCreateComponent={createComponentFromSelection}
        onGoToMainComponent={goToMainComponent}
        onInsertInstance={insertComponentInstance}
        onSelectTab={setLeftTab}
        onToggleLocked={(nodeId) => {
          const node = design.nodes[nodeId];
          if (node) commit(createLayerMetaTransaction(nodeId, { locked: !node.locked }, metadata("lock")));
        }}
        onToggleVisible={(nodeId) => {
          const node = design.nodes[nodeId];
          if (node) commit(createLayerMetaTransaction(nodeId, { visible: !node.visible }, metadata("visible")));
        }}
        selection={selection}
        setSelection={setSelection}
      />

      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TopToolbar
          actorName={actor.name}
          activePanel={activePanel}
          activeTool={activeTool}
          collabStatus={collabStatus}
          commentMode={commentMode}
          onlineCount={remotePresences.length + (collabStatus === "connected" ? 1 : 0)}
          onSelectTool={setActiveTool}
          onToggleCommentMode={toggleCommentMode}
          onTogglePanel={togglePanel}
          sessionId={sessionId}
        />
        <CanvasShell
          activeCommentId={activeCommentId}
          activePanel={activePanel}
          activeTool={activeTool}
          commentFocusKey={commentFocusKey}
          commentMode={commentMode}
          comments={comments}
          history={history}
          lastSequence={lastSequence}
          onActiveToolChange={setActiveTool}
          onBroadcastOperations={broadcastOperations}
          onClosePanel={closeActivePanel}
          onCreateComment={createComment}
          onCursorMove={updateCursor}
          onJumpToComment={jumpToComment}
          onReplyToComment={replyToComment}
          onResolveComment={setCommentResolved}
          onCreateSnapshot={createNamedSnapshot}
          onRestoreSnapshot={restoreSnapshot}
          onBranchFromReplay={branchFromReplay}
          onCreatePrototypeLink={createPrototypeLink}
          onPreviewBack={previewBack}
          onPreviewNavigate={previewNavigate}
          onStartPreview={startPrototypePreview}
          onSelectComment={setActiveCommentId}
          previewBackCount={previewBackStack.length}
          previewNodeId={previewNodeId}
          remotePresences={remotePresences}
          selection={selection}
          setCommentAuthor={setCommentAuthor}
          setHistory={setHistory}
          setSelection={setSelection}
          commentAuthor={commentAuthor}
        />
        <MobilePanelSummary activePanel={activePanel} onTogglePanel={togglePanel} />
        <footer className="flex h-9 shrink-0 items-center justify-between border-t border-desk-line bg-white px-4 text-xs text-desk-muted">
          <span>Session: {sessionId}</span>
          <span>Design Desk local demo</span>
        </footer>
      </section>

      <InspectorPanel
        design={design}
        onDetachInstance={detachInstance}
        onGoToMainComponent={goToMainFromInstance}
        onUpdateConstraints={(nodeId, constraints) =>
          commit(createTransaction("tx_update_constraints", "Update constraints", [{ ...metadata("constraints"), kind: "node.updateConstraints", payload: { nodeId, constraints } }]))
        }
        onUpdateGeometry={(nodeId, geometry) =>
          commit(createTransaction("tx_update_geometry", "Update geometry", [{ ...metadata("geometry"), kind: "node.updateGeometry", payload: { nodeId, geometry } }]))
        }
        onUpdateInstanceOverrides={updateInstanceOverrides}
        onUpdateStyle={(nodeId, style) =>
          commit(createTransaction("tx_update_style", "Update style", [{ ...metadata("style"), kind: "node.updateStyle", payload: { nodeId, style } }]))
        }
        selectedId={selection.activeId}
      />
      <ToastStack />
      <ModalShell />
    </main>
  );
}

function LeftPanel({
  design,
  leftTab,
  onReorder,
  onCreateComponent,
  onGoToMainComponent,
  onInsertInstance,
  onSelectTab,
  onToggleLocked,
  onToggleVisible,
  selection,
  setSelection,
}: {
  design: DesignFile;
  leftTab: "layers" | "assets";
  onCreateComponent: () => void;
  onGoToMainComponent: (componentId: ComponentId) => void;
  onInsertInstance: (componentId: ComponentId) => void;
  onReorder: (nodeId: NodeId, direction: "up" | "down") => void;
  onSelectTab: (tab: "layers" | "assets") => void;
  onToggleLocked: (nodeId: NodeId) => void;
  onToggleVisible: (nodeId: NodeId) => void;
  selection: SelectionState;
  setSelection: React.Dispatch<React.SetStateAction<SelectionState>>;
}) {
  return (
    <aside className="hidden w-[284px] shrink-0 flex-col border-r border-desk-line bg-white lg:flex" data-testid="left-panel">
      <div className="flex h-14 items-center gap-2 border-b border-desk-line px-4">
        <div className="flex size-8 items-center justify-center rounded bg-desk-accent text-white">
          <Sparkles size={18} aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-sm font-semibold leading-5">Design Desk</h1>
          <p className="text-xs text-desk-muted">AI Builder starter file</p>
        </div>
      </div>

      <div className="flex border-b border-desk-line px-3 py-2">
        <button className={`flex flex-1 items-center justify-center gap-2 rounded px-3 py-2 text-xs font-medium ${leftTab === "layers" ? "bg-slate-100" : "text-desk-muted"}`} onClick={() => onSelectTab("layers")}>
          <Layers size={15} aria-hidden="true" />
          Layers
        </button>
        <button className={`flex flex-1 items-center justify-center gap-2 rounded px-3 py-2 text-xs font-medium ${leftTab === "assets" ? "bg-slate-100" : "text-desk-muted"}`} onClick={() => onSelectTab("assets")}>
          <Component size={15} aria-hidden="true" />
          Assets
        </button>
      </div>

      {leftTab === "layers" ? (
        <LayersPanel
          design={design}
          onJumpToLayer={(nodeId) => setSelection(selectOne(nodeId))}
          onReorder={onReorder}
          onToggleLocked={onToggleLocked}
          onToggleVisible={onToggleVisible}
          selection={selection}
        />
      ) : (
        <AssetsPanel
          canCreateComponent={selection.selectedIds.length > 0}
          design={design}
          onCreateComponent={onCreateComponent}
          onGoToMainComponent={onGoToMainComponent}
          onInsertInstance={onInsertInstance}
        />
      )}

      <DemoProjectPicker />
    </aside>
  );
}

function TopToolbar({
  activePanel,
  activeTool,
  actorName,
  collabStatus,
  commentMode,
  onlineCount,
  onSelectTool,
  onToggleCommentMode,
  onTogglePanel,
  sessionId,
}: {
  activePanel: AdvancedPanel | null;
  activeTool: CanvasTool;
  actorName: string;
  collabStatus: "connecting" | "connected" | "offline";
  commentMode: boolean;
  onlineCount: number;
  onSelectTool: (tool: CanvasTool) => void;
  onToggleCommentMode: () => void;
  onTogglePanel: (panel: AdvancedPanel) => void;
  sessionId: string;
}) {
  return (
    <header
      className="flex h-auto shrink-0 flex-col gap-2 border-b border-desk-line bg-white p-3 sm:px-4"
      data-testid="top-toolbar"
    >
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-start">
        <div className="flex items-center gap-2 lg:hidden">
          <div className="flex size-8 items-center justify-center rounded bg-desk-accent text-white">
            <Sparkles size={18} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-5">Design Desk</h1>
            <p className="text-xs text-desk-muted">Local workspace</p>
          </div>
        </div>

        <div className="flex max-w-[calc(100vw-2rem)] items-center gap-1 overflow-x-auto sm:max-w-none" role="toolbar" aria-label="Canvas tools">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const selected = activeTool === tool.label;
            return (
              <button
                aria-label={tool.label === "Select" ? "Select" : `Create ${tool.label}`}
                aria-pressed={selected}
                className={`flex size-9 items-center justify-center rounded ${
                  selected ? "bg-desk-ink text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
                key={tool.label}
                onClick={() => onSelectTool(tool.label)}
                title={tool.label === "Select" ? "Select" : `Create ${tool.label}`}
                type="button"
              >
                <Icon size={17} aria-hidden="true" />
              </button>
            );
          })}
          <select
            aria-label="More creation tools"
            className={`h-9 rounded border border-desk-line px-2 text-xs font-semibold outline-none ${moreTools.includes(activeTool as CreationTool) ? "bg-desk-ink text-white" : "bg-white text-slate-700"}`}
            onChange={(event) => {
              if (event.target.value) {
                onSelectTool(event.target.value as CreationTool);
              }
            }}
            title="More creation tools"
            value={moreTools.includes(activeTool as CreationTool) ? activeTool : ""}
          >
            <option value="">More</option>
            {moreTools.map((tool) => (
              <option key={tool} value={tool}>
                {tool}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <div className="flex shrink-0 items-center gap-2 rounded bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-800" data-testid="demo-mode-banner">
          <Sparkles size={14} aria-hidden="true" />
          Demo mode
        </div>
        <button className="flex shrink-0 items-center gap-2 rounded border border-desk-line px-3 py-2 text-xs font-medium" data-testid="presence-list">
          <Users size={15} aria-hidden="true" />
          {collabStatus === "connected" ? `${onlineCount} online` : "Offline"}
          <span className="text-desk-muted">{actorName}</span>
        </button>
        <button className="flex shrink-0 items-center gap-2 rounded border border-desk-line px-3 py-2 text-xs font-medium" type="button">
          <Eye size={15} aria-hidden="true" />
          Preview
        </button>
        <button
          aria-pressed={commentMode}
          className={`flex shrink-0 items-center gap-2 rounded border border-desk-line px-3 py-2 text-xs font-medium ${commentMode ? "bg-desk-ink text-white" : ""}`}
          onClick={onToggleCommentMode}
          type="button"
        >
          <MessageSquare size={15} aria-hidden="true" />
          Comment
        </button>
        <button
          aria-pressed={activePanel === "history"}
          className={`flex shrink-0 items-center gap-2 rounded border border-desk-line px-3 py-2 text-xs font-medium ${activePanel === "history" ? "bg-desk-ink text-white" : ""}`}
          onClick={() => onTogglePanel("history")}
          type="button"
        >
          <History size={15} aria-hidden="true" />
          History
        </button>
        <button
          aria-pressed={activePanel === "replay"}
          className={`flex shrink-0 items-center gap-2 rounded border border-desk-line px-3 py-2 text-xs font-medium ${activePanel === "replay" ? "bg-desk-ink text-white" : ""}`}
          onClick={() => onTogglePanel("replay")}
          type="button"
        >
          <Play size={15} aria-hidden="true" />
          Replay
        </button>
        <a className="flex shrink-0 items-center gap-2 rounded bg-desk-accent px-3 py-2 text-xs font-semibold text-white" href={`?sessionId=${encodeURIComponent(sessionId)}`}>
          <Share2 size={15} aria-hidden="true" />
          Share
        </a>
      </div>
    </header>
  );
}

function CanvasShell({
  activeCommentId,
  activePanel,
  activeTool,
  commentAuthor,
  commentFocusKey,
  commentMode,
  comments,
  history,
  lastSequence,
  onActiveToolChange,
  onBroadcastOperations,
  onClosePanel,
  onCreateComment,
  onCursorMove,
  onJumpToComment,
  onReplyToComment,
  onResolveComment,
  onCreateSnapshot,
  onRestoreSnapshot,
  onBranchFromReplay,
  onCreatePrototypeLink,
  onPreviewBack,
  onPreviewNavigate,
  onStartPreview,
  onSelectComment,
  previewBackCount,
  previewNodeId,
  remotePresences,
  selection,
  setCommentAuthor,
  setHistory,
  setSelection,
}: {
  activeCommentId: CommentId | null;
  activePanel: AdvancedPanel | null;
  activeTool: CanvasTool;
  commentAuthor: string;
  commentFocusKey: number;
  commentMode: boolean;
  comments: readonly CommentThread[];
  history: HistoryState;
  lastSequence: number;
  onActiveToolChange: (tool: CanvasTool) => void;
  onBroadcastOperations: (operations: readonly DesignOperation[]) => void;
  onClosePanel: () => void;
  onCreateComment: (point: Point, nodeId: NodeId) => void;
  onCursorMove: (point: Point) => void;
  onJumpToComment: (commentId: CommentId) => void;
  onReplyToComment: (commentId: CommentId, body: string) => void;
  onResolveComment: (commentId: CommentId, resolved: boolean) => void;
  onCreateSnapshot: (name: string) => void;
  onRestoreSnapshot: (snapshotId: SnapshotId) => void;
  onBranchFromReplay: (step: number) => void;
  onCreatePrototypeLink: (targetId: NodeId) => void;
  onPreviewBack: () => void;
  onPreviewNavigate: (sourceId: NodeId) => void;
  onStartPreview: (sourceId: NodeId) => void;
  onSelectComment: (commentId: CommentId) => void;
  previewBackCount: number;
  previewNodeId: NodeId | null;
  remotePresences: readonly PresenceState[];
  selection: SelectionState;
  setCommentAuthor: (author: string) => void;
  setHistory: React.Dispatch<React.SetStateAction<HistoryState>>;
  setSelection: React.Dispatch<React.SetStateAction<SelectionState>>;
}) {
  return (
    <div
      className="relative min-h-0 flex-1 overflow-hidden bg-[radial-gradient(circle_at_1px_1px,rgba(102,112,133,0.28)_1px,transparent_0)] [background-size:24px_24px]"
      data-testid="canvas-shell"
    >
      <div className="absolute left-4 top-4 flex items-center gap-2 rounded border border-desk-line bg-white/95 px-3 py-2 text-xs font-medium shadow-panel sm:left-6 sm:top-5">
        <span className="size-2 rounded-full bg-emerald-500" />
        100% · Seq {lastSequence}
      </div>
      <SvgCanvas
        activeCommentId={activeCommentId}
        activeTool={activeTool}
        commentFocusKey={commentFocusKey}
        commentMode={commentMode}
        comments={comments}
        history={history}
        onActiveToolChange={onActiveToolChange}
        onBroadcastOperations={onBroadcastOperations}
        onCreateComment={onCreateComment}
        onCursorMove={onCursorMove}
        onSelectComment={onSelectComment}
        remotePresences={remotePresences}
        selection={selection}
        setHistory={setHistory}
        setSelection={setSelection}
      />
      {activePanel === "comments" ? (
        <CommentsPanel
          activeCommentId={activeCommentId}
          author={commentAuthor}
          comments={comments}
          onAuthorChange={setCommentAuthor}
          onClose={onClosePanel}
          onJumpToComment={onJumpToComment}
          onReply={onReplyToComment}
          onResolve={onResolveComment}
        />
      ) : null}
      {activePanel === "history" ? <VersionHistoryPanel design={history.present} onClose={onClosePanel} onCreateSnapshot={onCreateSnapshot} onRestoreSnapshot={onRestoreSnapshot} /> : null}
      {activePanel === "replay" ? <ReplayPanel history={history} initialDesign={history.past.length === 0 ? history.present : createStarterDesign()} onBranch={onBranchFromReplay} onClose={onClosePanel} /> : null}
      {previewNodeId ? <PreviewOverlay design={history.present} frameId={previewNodeId} onNavigate={onPreviewNavigate} /> : null}
      <PrototypePanel
        design={history.present}
        onCreateLink={onCreatePrototypeLink}
        onPreviewBack={onPreviewBack}
        onStartPreview={onStartPreview}
        previewBackCount={previewBackCount}
        previewNodeId={previewNodeId}
        selectedId={selection.activeId}
      />
    </div>
  );
}

function MobilePanelSummary({
  activePanel,
  onTogglePanel,
}: {
  activePanel: AdvancedPanel | null;
  onTogglePanel: (panel: AdvancedPanel) => void;
}) {
  const items: { label: string; panel: AdvancedPanel; icon: typeof MessageSquare }[] = [
    { label: "Comments", panel: "comments", icon: MessageSquare },
    { label: "History", panel: "history", icon: History },
    { label: "Replay", panel: "replay", icon: Play },
  ];

  return (
    <div className="grid shrink-0 grid-cols-3 border-t border-desk-line bg-white text-xs lg:hidden" data-testid="mobile-panel-summary">
      {items.map((item, index) => {
        const Icon = item.icon;
        const active = activePanel === item.panel;
        return (
          <button
            aria-pressed={active}
            className={`flex items-center justify-center gap-2 px-2 py-3 font-medium ${index === 1 ? "border-x border-desk-line" : ""} ${active ? "bg-desk-ink text-white" : ""}`}
            key={item.panel}
            onClick={() => onTogglePanel(item.panel)}
            type="button"
          >
            <Icon size={15} aria-hidden="true" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
