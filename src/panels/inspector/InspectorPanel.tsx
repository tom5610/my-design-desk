import type { Constraints, DesignFile, Geometry, NodeId, NodeStyle, SceneNode } from "../../model";

type GeometryNode = Extract<SceneNode, { geometry: Geometry }>;
type StyledNode = Extract<SceneNode, { style: NodeStyle }>;

function hasGeometry(node: SceneNode): node is GeometryNode {
  return "geometry" in node;
}

function hasStyle(node: SceneNode): node is StyledNode {
  return "style" in node;
}

export function InspectorPanel({
  design,
  onUpdateConstraints,
  onUpdateGeometry,
  onUpdateStyle,
  selectedId,
}: {
  design: DesignFile;
  onUpdateConstraints: (nodeId: NodeId, constraints: Constraints) => void;
  onUpdateGeometry: (nodeId: NodeId, geometry: Geometry) => void;
  onUpdateStyle: (nodeId: NodeId, style: NodeStyle) => void;
  selectedId: NodeId | null;
}) {
  const node = selectedId ? design.nodes[selectedId] : null;

  return (
    <aside className="hidden w-[320px] shrink-0 flex-col border-l border-desk-line bg-white xl:flex" data-testid="right-inspector">
      <div className="flex h-14 items-center justify-between border-b border-desk-line px-4">
        <div>
          <h2 className="text-sm font-semibold">Inspector</h2>
          <p className="text-xs text-desk-muted">{node?.name ?? "No selection"}</p>
        </div>
      </div>

      {!node ? (
        <div className="p-4 text-sm text-desk-muted">Select a layer or canvas node.</div>
      ) : (
        <div className="space-y-5 overflow-auto p-4">
          {hasGeometry(node) ? (
            <GeometryEditor node={node} onUpdate={(geometry) => onUpdateGeometry(node.id, geometry)} />
          ) : null}
          {hasStyle(node) ? <StyleEditor node={node} onUpdate={(style) => onUpdateStyle(node.id, style)} /> : null}
          <ConstraintsEditor node={node} onUpdate={(constraints) => onUpdateConstraints(node.id, constraints)} />
        </div>
      )}
    </aside>
  );
}

function GeometryEditor({ node, onUpdate }: { node: GeometryNode; onUpdate: (geometry: Geometry) => void }) {
  const fields = [
    ["X", "x"],
    ["Y", "y"],
    ["W", "width"],
    ["H", "height"],
    ["Rotate", "rotation"],
  ] as const;

  return (
    <section>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-desk-muted">Geometry</h3>
      <div className="grid grid-cols-2 gap-2">
        {fields.map(([label, key]) => (
          <label className="rounded border border-desk-line px-3 py-2" key={key}>
            <span className="block text-[11px] font-medium text-desk-muted">{label}</span>
            <input
              aria-label={`Inspector ${label}`}
              className="mt-1 w-full bg-transparent text-sm font-medium outline-none"
              onChange={(event) => onUpdate({ ...node.geometry, [key]: Number(event.target.value) })}
              type="number"
              value={node.geometry[key]}
            />
          </label>
        ))}
      </div>
    </section>
  );
}

function StyleEditor({ node, onUpdate }: { node: StyledNode; onUpdate: (style: NodeStyle) => void }) {
  const fill = node.style.fills.find((candidate) => candidate.kind === "solid");
  const color = fill?.kind === "solid" ? fill.color : "#ffffff";

  return (
    <section>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-desk-muted">Appearance</h3>
      <div className="space-y-2">
        <label className="flex items-center justify-between rounded border border-desk-line px-3 py-2 text-sm">
          Fill
          <input
            aria-label="Inspector fill"
            className="size-7"
            onChange={(event) => onUpdate({ ...node.style, fills: [{ kind: "solid", color: `#${event.target.value.replace("#", "")}` }] })}
            type="color"
            value={color.startsWith("#") ? color : "#ffffff"}
          />
        </label>
        <label className="rounded border border-desk-line px-3 py-2">
          <span className="block text-[11px] font-medium text-desk-muted">Opacity</span>
          <input
            aria-label="Inspector opacity"
            className="mt-1 w-full"
            max={1}
            min={0}
            onChange={(event) => onUpdate({ ...node.style, opacity: Number(event.target.value) })}
            step={0.05}
            type="range"
            value={node.style.opacity}
          />
        </label>
      </div>
    </section>
  );
}

function ConstraintsEditor({ node, onUpdate }: { node: SceneNode; onUpdate: (constraints: Constraints) => void }) {
  return (
    <section>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-desk-muted">Constraints</h3>
      <div className="grid grid-cols-2 gap-2">
        <select
          aria-label="Horizontal constraint"
          className="rounded border border-desk-line px-2 py-2 text-sm"
          onChange={(event) => onUpdate({ ...node.constraints, horizontal: event.target.value as Constraints["horizontal"] })}
          value={node.constraints.horizontal}
        >
          {["left", "right", "leftRight", "center", "scale"].map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
        <select
          aria-label="Vertical constraint"
          className="rounded border border-desk-line px-2 py-2 text-sm"
          onChange={(event) => onUpdate({ ...node.constraints, vertical: event.target.value as Constraints["vertical"] })}
          value={node.constraints.vertical}
        >
          {["top", "bottom", "topBottom", "center", "scale"].map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
      </div>
    </section>
  );
}
