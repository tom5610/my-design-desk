export function ModalShell() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden items-start justify-center p-4" data-testid="modal-shell" aria-hidden="true">
      <div className="mt-16 w-full max-w-md rounded border border-desk-line bg-white p-4 shadow-panel">
        <h2 className="text-sm font-semibold">Shortcuts</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-desk-muted">
          <span>Delete</span>
          <span>Remove selection</span>
          <span>Cmd/Ctrl Z</span>
          <span>Undo</span>
          <span>Arrow keys</span>
          <span>Nudge</span>
        </div>
      </div>
    </div>
  );
}
