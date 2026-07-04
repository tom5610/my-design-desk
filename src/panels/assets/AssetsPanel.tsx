import type { DesignFile } from "../../model";

export function AssetsPanel({ design }: { design: DesignFile }) {
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
        {components.map((component) => (
          <div className="rounded border border-desk-line px-3 py-2 text-sm" key={component.id}>{component.name}</div>
        ))}
      </AssetSection>
    </section>
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
