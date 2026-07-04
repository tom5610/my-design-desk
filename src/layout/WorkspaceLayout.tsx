import {
  Circle,
  Component,
  Download,
  Eye,
  Layers,
  MessageSquare,
  MousePointer2,
  Play,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Square,
  Type,
  Users,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { DemoProjectPicker } from "../ui/DemoProjectPicker";
import { ModalShell } from "../ui/ModalShell";
import { ToastStack } from "../ui/ToastStack";
import { SvgCanvas } from "../canvas";
import { createStarterDesign } from "../demo";
import type { NodeId } from "../model";
import { createLayerMetaTransaction, createReorderTransaction, LayersPanel } from "../panels/layers";
import { AssetsPanel } from "../panels/assets";
import { selectOne, type SelectionState, emptySelection } from "../selection";
import { commitTransaction, createHistoryState, type HistoryState } from "../store";
import type { OperationMetadata } from "../ops";

const properties = [
  ["X", "128"],
  ["Y", "96"],
  ["W", "960"],
  ["H", "620"],
  ["Rotate", "0"],
  ["Radius", "16"],
];

const tools = [
  { label: "Select", icon: MousePointer2, active: true },
  { label: "Frame", icon: Square },
  { label: "Ellipse", icon: Circle },
  { label: "Text", icon: Type },
];

export function WorkspaceLayout() {
  const initialDesign = useMemo(() => createStarterDesign(), []);
  const [history, setHistory] = useState<HistoryState>(() => createHistoryState(initialDesign));
  const [selection, setSelection] = useState<SelectionState>(emptySelection);
  const [leftTab, setLeftTab] = useState<"layers" | "assets">("layers");
  const opCounter = useRef(0);
  const design = history.present;

  function metadata(kind: string): OperationMetadata {
    opCounter.current += 1;
    return {
      opId: `layer_${kind}_${opCounter.current}`,
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
    }
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
        <TopToolbar />
        <CanvasShell history={history} selection={selection} setHistory={setHistory} setSelection={setSelection} />
        <MobilePanelSummary />
        <footer className="flex h-9 shrink-0 items-center justify-between border-t border-desk-line bg-white px-4 text-xs text-desk-muted">
          <span>Session: local-demo</span>
          <span>Milestone 6 workspace shell</span>
        </footer>
      </section>

      <InspectorPanel />
      <ToastStack />
      <ModalShell />
    </main>
  );
}

function LeftPanel({
  design,
  leftTab,
  onReorder,
  onSelectTab,
  onToggleLocked,
  onToggleVisible,
  selection,
  setSelection,
}: {
  design: ReturnType<typeof createStarterDesign>;
  leftTab: "layers" | "assets";
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
        <AssetsPanel design={design} />
      )}

      <DemoProjectPicker />
    </aside>
  );
}

function TopToolbar() {
  return (
    <header
      className="flex h-auto shrink-0 flex-col gap-2 border-b border-desk-line bg-white p-3 sm:h-14 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-0"
      data-testid="top-toolbar"
    >
      <div className="flex items-center justify-between gap-2 sm:justify-start">
        <div className="flex items-center gap-2 lg:hidden">
          <div className="flex size-8 items-center justify-center rounded bg-desk-accent text-white">
            <Sparkles size={18} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-5">Design Desk</h1>
            <p className="text-xs text-desk-muted">Local workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-1" role="toolbar" aria-label="Canvas tools">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                aria-label={tool.label}
                className={`flex size-9 items-center justify-center rounded ${
                  tool.active ? "bg-desk-ink text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
                key={tool.label}
                title={tool.label}
              >
                <Icon size={17} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto">
        <button className="flex shrink-0 items-center gap-2 rounded border border-desk-line px-3 py-2 text-xs font-medium">
          <Users size={15} aria-hidden="true" />
          Local session
        </button>
        <button className="flex shrink-0 items-center gap-2 rounded border border-desk-line px-3 py-2 text-xs font-medium">
          <Eye size={15} aria-hidden="true" />
          Preview
        </button>
        <button className="flex shrink-0 items-center gap-2 rounded bg-desk-accent px-3 py-2 text-xs font-semibold text-white">
          <Share2 size={15} aria-hidden="true" />
          Share
        </button>
      </div>
    </header>
  );
}

function CanvasShell({
  history,
  selection,
  setHistory,
  setSelection,
}: {
  history: HistoryState;
  selection: SelectionState;
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
        100% · Draft saved locally
      </div>
      <SvgCanvas history={history} selection={selection} setHistory={setHistory} setSelection={setSelection} />
    </div>
  );
}

function InspectorPanel() {
  return (
    <aside className="hidden w-[320px] shrink-0 flex-col border-l border-desk-line bg-white xl:flex" data-testid="right-inspector">
      <div className="flex h-14 items-center justify-between border-b border-desk-line px-4">
        <div>
          <h2 className="text-sm font-semibold">Inspector</h2>
          <p className="text-xs text-desk-muted">Landing page frame</p>
        </div>
        <SlidersHorizontal size={18} aria-hidden="true" />
      </div>

      <div className="space-y-5 overflow-auto p-4">
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-desk-muted">Geometry</h3>
          <div className="grid grid-cols-2 gap-2">
            {properties.map(([label, value]) => (
              <label className="rounded border border-desk-line px-3 py-2" key={label}>
                <span className="block text-[11px] font-medium text-desk-muted">{label}</span>
                <input className="mt-1 w-full bg-transparent text-sm font-medium outline-none" value={value} readOnly />
              </label>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-desk-muted">Appearance</h3>
          <div className="space-y-2">
            <button className="flex w-full items-center justify-between rounded border border-desk-line px-3 py-2 text-sm">
              Fill
              <span className="size-5 rounded bg-teal-600" />
            </button>
            <button className="flex w-full items-center justify-between rounded border border-desk-line px-3 py-2 text-sm">
              Stroke
              <span className="size-5 rounded border border-slate-400" />
            </button>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-desk-muted">Panels</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Comments", icon: MessageSquare },
              { label: "Replay", icon: Play },
              { label: "Export", icon: Download },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button className="flex flex-col items-center gap-2 rounded border border-desk-line px-2 py-3 text-xs" key={item.label}>
                  <Icon size={16} aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </aside>
  );
}

function MobilePanelSummary() {
  return (
    <div className="grid shrink-0 grid-cols-3 border-t border-desk-line bg-white text-xs lg:hidden" data-testid="mobile-panel-summary">
      <button className="flex items-center justify-center gap-2 px-2 py-3 font-medium">
        <Layers size={15} aria-hidden="true" />
        Layers
      </button>
      <button className="flex items-center justify-center gap-2 border-x border-desk-line px-2 py-3 font-medium">
        <SlidersHorizontal size={15} aria-hidden="true" />
        Inspect
      </button>
      <button className="flex items-center justify-center gap-2 px-2 py-3 font-medium">
        <Play size={15} aria-hidden="true" />
        Replay
      </button>
    </div>
  );
}
