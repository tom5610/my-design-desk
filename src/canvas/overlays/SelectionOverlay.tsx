import type { DesignFile, Geometry, NodeId, SceneNode } from "../../model";

type GeometryNode = Extract<SceneNode, { geometry: Geometry }>;

function hasGeometry(node: SceneNode): node is GeometryNode {
  return "geometry" in node;
}

export function SelectionOverlay({ design, selectedIds }: { design: DesignFile; selectedIds: readonly NodeId[] }) {
  return (
    <g data-testid="selection-overlay">
      {selectedIds.map((nodeId) => {
        const node = design.nodes[nodeId];
        if (!node || !hasGeometry(node)) {
          return null;
        }

        const { x, y, width, height } = node.geometry;
        const handles = [
          [x, y],
          [x + width / 2, y],
          [x + width, y],
          [x, y + height / 2],
          [x + width, y + height / 2],
          [x, y + height],
          [x + width / 2, y + height],
          [x + width, y + height],
        ] as const;

        return (
          <g data-selected-node-id={nodeId} key={nodeId}>
            <rect
              data-testid="selection-outline"
              fill="none"
              height={height}
              pointerEvents="none"
              stroke="#2563eb"
              strokeDasharray="6 4"
              strokeWidth={2}
              width={width}
              x={x}
              y={y}
            />
            {handles.map(([handleX, handleY]) => (
              <rect
                className="selection-handle"
                data-testid="selection-handle"
                fill="#ffffff"
                height={8}
                key={`${handleX}-${handleY}`}
                stroke="#2563eb"
                strokeWidth={2}
                width={8}
                x={handleX - 4}
                y={handleY - 4}
              />
            ))}
            <circle
              data-testid="rotation-handle"
              cx={x + width / 2}
              cy={y - 28}
              fill="#ffffff"
              r={6}
              stroke="#2563eb"
              strokeWidth={2}
            />
          </g>
        );
      })}
    </g>
  );
}
