export function ModalShell() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden items-start justify-center p-4" data-testid="modal-shell" aria-hidden="true">
      <div className="mt-16 w-full max-w-md rounded border border-desk-line bg-white p-4 shadow-panel" />
    </div>
  );
}
