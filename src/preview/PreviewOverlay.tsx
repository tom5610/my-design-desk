import { ArrowRight, MousePointerClick } from "lucide-react";

import type { DesignFile, NodeId } from "../model";
import { getPrototypeHotspots } from "../prototype";

export function PreviewOverlay({
  design,
  frameId,
  onNavigate,
}: {
  design: DesignFile;
  frameId: NodeId;
  onNavigate: (sourceId: NodeId) => void;
}) {
  const frame = design.nodes[frameId];
  const hotspots = getPrototypeHotspots(design, frameId);

  return (
    <section
      aria-label="Prototype preview"
      className="absolute inset-0 z-20 flex items-start justify-center bg-slate-950/45 px-4 py-12 backdrop-blur-[2px]"
      data-testid="prototype-preview-overlay"
    >
      <div className="w-full max-w-[760px] rounded border border-slate-300 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-desk-line px-4 py-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-desk-muted">Preview frame</p>
            <h2 className="truncate text-sm font-semibold text-desk-ink">{frame?.name ?? "Missing frame"}</h2>
          </div>
          <div className="flex items-center gap-2 rounded bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-desk-muted">
            <MousePointerClick size={14} aria-hidden="true" />
            {hotspots.length} hotspots
          </div>
        </div>
        <div className="grid gap-2 p-4">
          {hotspots.length === 0 ? (
            <p className="rounded bg-slate-50 px-3 py-3 text-sm text-desk-muted">No hotspots on this frame.</p>
          ) : (
            hotspots.map((hotspot) => (
              <button
                aria-label={`Open prototype hotspot ${hotspot.source.name}`}
                className="flex items-center justify-between rounded border border-desk-line px-3 py-3 text-left text-sm hover:border-teal-600 hover:bg-teal-50"
                data-testid="prototype-hotspot"
                key={hotspot.link.id}
                onClick={() => onNavigate(hotspot.source.id)}
                type="button"
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-desk-ink">{hotspot.source.name}</span>
                  <span className="block truncate text-xs text-desk-muted">On click</span>
                </span>
                <span className="flex min-w-0 items-center gap-2 text-xs font-semibold text-teal-700">
                  <ArrowRight size={14} aria-hidden="true" />
                  <span className="truncate">{hotspot.target.name}</span>
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
