import { History, RotateCcw, Save } from "lucide-react";
import { useState } from "react";

import type { DesignFile, SnapshotId } from "../model";

export function VersionHistoryPanel({
  design,
  onCreateSnapshot,
  onRestoreSnapshot,
}: {
  design: DesignFile;
  onCreateSnapshot: (name: string) => void;
  onRestoreSnapshot: (snapshotId: SnapshotId) => void;
}) {
  const [name, setName] = useState("Milestone snapshot");
  const snapshots = Object.values(design.snapshots).sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  return (
    <aside className="absolute bottom-16 right-4 z-10 w-[320px] rounded border border-desk-line bg-white/95 shadow-panel" data-testid="version-history-panel">
      <div className="flex items-center gap-2 border-b border-desk-line px-3 py-2">
        <History size={15} aria-hidden="true" />
        <h2 className="text-sm font-semibold">Version history</h2>
      </div>
      <form
        className="flex gap-2 border-b border-desk-line p-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim()) {
            onCreateSnapshot(name.trim());
          }
        }}
      >
        <input
          aria-label="Snapshot name"
          className="min-w-0 flex-1 rounded border border-desk-line px-2 py-1.5 text-sm outline-none"
          onChange={(event) => setName(event.target.value)}
          value={name}
        />
        <button aria-label="Create snapshot" className="flex size-8 items-center justify-center rounded bg-desk-ink text-white" type="submit">
          <Save size={13} aria-hidden="true" />
        </button>
      </form>
      <div className="max-h-[240px] space-y-2 overflow-auto p-3">
        {snapshots.length === 0 ? (
          <p className="text-sm text-desk-muted">No snapshots yet.</p>
        ) : (
          snapshots.map((snapshot) => (
            <article className="rounded border border-desk-line bg-white px-3 py-2 text-sm" data-snapshot-id={snapshot.id} key={snapshot.id}>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="block truncate font-semibold">{snapshot.name}</span>
                  <span className="block text-[11px] text-desk-muted">{snapshot.createdAt}</span>
                </div>
                <button
                  aria-label={`Restore ${snapshot.name}`}
                  className="flex size-8 shrink-0 items-center justify-center rounded bg-slate-100 hover:bg-slate-200"
                  onClick={() => onRestoreSnapshot(snapshot.id)}
                  type="button"
                >
                  <RotateCcw size={13} aria-hidden="true" />
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </aside>
  );
}
