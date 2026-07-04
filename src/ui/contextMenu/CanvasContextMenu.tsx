export type ContextMenuAction = "bring-forward" | "send-backward" | "bring-front" | "send-back" | "lock" | "group";

const actions: { id: ContextMenuAction; label: string }[] = [
  { id: "bring-forward", label: "Bring forward" },
  { id: "send-backward", label: "Send backward" },
  { id: "bring-front", label: "Bring to front" },
  { id: "send-back", label: "Send to back" },
  { id: "lock", label: "Lock selection" },
  { id: "group", label: "Group selection" },
];

export function CanvasContextMenu({
  onAction,
  onClose,
  position,
}: {
  onAction: (action: ContextMenuAction) => void;
  onClose: () => void;
  position: { x: number; y: number } | null;
}) {
  if (!position) return null;

  return (
    <div className="fixed z-50 w-44 rounded border border-desk-line bg-white p-1 text-sm shadow-panel" data-testid="context-menu" style={{ left: position.x, top: position.y }}>
      {actions.map((action) => (
        <button
          className="block w-full rounded px-3 py-2 text-left hover:bg-slate-100"
          key={action.id}
          onClick={() => {
            onAction(action.id);
            onClose();
          }}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
