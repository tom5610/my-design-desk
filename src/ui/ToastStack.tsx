export function ToastStack() {
  return (
    <div className="pointer-events-none absolute bottom-12 right-4 hidden w-[280px] space-y-2 lg:block" data-testid="toast-stack">
      <div className="rounded border border-desk-line bg-white px-3 py-2 text-xs shadow-panel">
        <span className="font-semibold text-desk-ink">Local autosave</span>
        <span className="block text-desk-muted">Session store is ready.</span>
      </div>
    </div>
  );
}
