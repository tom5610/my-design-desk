import { Link2, Play, RotateCcw } from "lucide-react";

import type { DesignFile, NodeId } from "../model";

export function PrototypePanel({
  design,
  onCreateLink,
  onPreviewBack,
  onStartPreview,
  previewBackCount,
  previewNodeId,
  selectedId,
}: {
  design: DesignFile;
  onCreateLink: (targetId: NodeId) => void;
  onPreviewBack: () => void;
  onStartPreview: (sourceId: NodeId) => void;
  previewBackCount: number;
  previewNodeId: NodeId | null;
  selectedId: NodeId | null;
}) {
  const frames = design.rootIds.map((rootId) => design.nodes[rootId]).filter(Boolean);
  const selected = selectedId ? design.nodes[selectedId] : null;
  const activePreview = previewNodeId ? design.nodes[previewNodeId] : null;
  const linkCount = Object.values(design.prototypeLinks).length;

  if (!selected && !activePreview && linkCount === 0) {
    return null;
  }

  return (
    <aside className="absolute right-4 top-20 z-30 w-[300px] rounded border border-desk-line bg-white/95 shadow-panel" data-testid="prototype-panel">
      <div className="flex items-center gap-2 border-b border-desk-line px-3 py-2">
        <Link2 size={15} aria-hidden="true" />
        <h2 className="text-sm font-semibold">Prototype</h2>
      </div>
      <div className="space-y-3 p-3 text-sm">
        <div className="rounded bg-slate-50 px-3 py-2">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-desk-muted">Hotspot</span>
          {selected?.name ?? "Select a layer"}
        </div>
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-desk-muted">
          Target frame
          <select
            aria-label="Prototype target"
            className="mt-1 w-full rounded border border-desk-line px-2 py-1.5 text-sm normal-case tracking-normal"
            onChange={(event) => onCreateLink(event.target.value as NodeId)}
            value=""
          >
            <option value="" disabled>
              Create link
            </option>
            {frames.map((frame) => (
              <option key={frame.id} value={frame.id}>
                {frame.name}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            aria-label="Preview selected prototype"
            className="flex items-center justify-center gap-1 rounded bg-desk-ink px-2 py-2 text-xs font-semibold text-white disabled:bg-slate-200 disabled:text-slate-500"
            disabled={!selectedId}
            onClick={() => selectedId && onStartPreview(selectedId)}
            type="button"
          >
            <Play size={13} aria-hidden="true" />
            Preview
          </button>
          <button
            aria-label="Prototype back"
            className="flex items-center justify-center gap-1 rounded bg-slate-100 px-2 py-2 text-xs font-semibold hover:bg-slate-200"
            onClick={onPreviewBack}
            type="button"
          >
            <RotateCcw size={13} aria-hidden="true" />
            Back
          </button>
        </div>
        <div className="rounded border border-desk-line px-3 py-2" data-testid="prototype-preview-state">
          {activePreview ? `Preview: ${activePreview.name}` : "Preview: editor"}
        </div>
        <div className="text-xs text-desk-muted">
          {linkCount} links · {previewBackCount} back
        </div>
      </div>
    </aside>
  );
}
