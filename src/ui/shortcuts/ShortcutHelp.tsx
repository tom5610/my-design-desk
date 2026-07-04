const shortcuts = [
  ["Select", "Click"],
  ["Nudge", "Arrow keys"],
  ["Duplicate", "Cmd/Ctrl+D"],
  ["Undo", "Cmd/Ctrl+Z"],
  ["Redo", "Cmd/Ctrl+Shift+Z"],
  ["Context menu", "Right click"],
];

export function ShortcutHelp({ onClose, open }: { onClose: () => void; open: boolean }) {
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-40 flex items-start justify-center bg-slate-950/20 p-4" data-testid="shortcut-help">
      <section className="mt-20 w-full max-w-sm rounded border border-desk-line bg-white p-4 shadow-panel">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Keyboard Shortcuts</h2>
          <button className="rounded border border-desk-line px-2 py-1 text-xs" onClick={onClose}>Close</button>
        </div>
        <div className="space-y-2">
          {shortcuts.map(([label, value]) => (
            <div className="flex items-center justify-between text-sm" key={label}>
              <span>{label}</span>
              <kbd className="rounded bg-slate-100 px-2 py-1 text-xs">{value}</kbd>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
