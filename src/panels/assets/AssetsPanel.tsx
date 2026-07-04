import { Component, CornerDownRight, LocateFixed, Plus } from "lucide-react";

import type { ComponentId, DesignFile, NodeId } from "../../model";

export function AssetsPanel({
  canCreateComponent,
  design,
  onCreateComponent,
  onGoToMainComponent,
  onInsertInstance,
}: {
  canCreateComponent: boolean;
  design: DesignFile;
  onCreateComponent: () => void;
  onGoToMainComponent: (componentId: ComponentId) => void;
  onInsertInstance: (componentId: ComponentId) => void;
}) {
  const colors = Object.values(design.styles.colors);
  const textStyles = Object.values(design.styles.text);
  const components = Object.values(design.components);

  return (
    <section className="space-y-4 overflow-auto p-3" data-testid="assets-panel">
      <AssetSection title="Color styles">
        {colors.map((color) => (
          <div className="flex items-center gap-2 rounded border border-desk-line px-3 py-2 text-sm" key={color.id}>
            <span className="size-4 rounded" style={{ background: color.value }} />
            <span>{color.name}</span>
          </div>
        ))}
      </AssetSection>
      <AssetSection title="Text styles">
        {textStyles.map((style) => (
          <div className="rounded border border-desk-line px-3 py-2 text-sm" key={style.id}>
            <span className="block font-medium">{style.name}</span>
            <span className="text-xs text-desk-muted">{style.fontSize}px / {style.fontWeight}</span>
          </div>
        ))}
      </AssetSection>
      <AssetSection title="Components">
        <button
          className="flex w-full items-center justify-center gap-2 rounded border border-desk-line bg-desk-ink px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          disabled={!canCreateComponent}
          onClick={onCreateComponent}
          type="button"
        >
          <Plus size={14} aria-hidden="true" />
          Create component
        </button>
        {components.map((component) => (
          <ComponentAsset
            componentId={component.id}
            componentName={component.name}
            key={component.id}
            rootNodeId={component.rootNodeId}
            onGoToMainComponent={onGoToMainComponent}
            onInsertInstance={onInsertInstance}
          />
        ))}
      </AssetSection>
    </section>
  );
}

function ComponentAsset({
  componentId,
  componentName,
  rootNodeId,
  onGoToMainComponent,
  onInsertInstance,
}: {
  componentId: ComponentId;
  componentName: string;
  rootNodeId: NodeId;
  onGoToMainComponent: (componentId: ComponentId) => void;
  onInsertInstance: (componentId: ComponentId) => void;
}) {
  return (
    <div className="rounded border border-desk-line px-3 py-2 text-sm">
      <div className="mb-2 flex items-center gap-2">
        <Component size={15} aria-hidden="true" />
        <div className="min-w-0">
          <span className="block truncate font-medium">{componentName}</span>
          <span className="block truncate text-[11px] text-desk-muted">{rootNodeId}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          aria-label={`Insert ${componentName} instance`}
          className="flex items-center justify-center gap-1 rounded bg-slate-100 px-2 py-1.5 text-xs font-semibold hover:bg-slate-200"
          onClick={() => onInsertInstance(componentId)}
          type="button"
        >
          <CornerDownRight size={13} aria-hidden="true" />
          Insert
        </button>
        <button
          aria-label={`Go to main ${componentName}`}
          className="flex items-center justify-center gap-1 rounded bg-slate-100 px-2 py-1.5 text-xs font-semibold hover:bg-slate-200"
          onClick={() => onGoToMainComponent(componentId)}
          type="button"
        >
          <LocateFixed size={13} aria-hidden="true" />
          Main
        </button>
      </div>
    </div>
  );
}

function AssetSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-desk-muted">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
