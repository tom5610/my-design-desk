import type { PresenceState } from "../../../collab";
import type { DesignFile, Geometry, NodeId, SceneNode } from "../../../model";

type GeometryNode = Extract<SceneNode, { geometry: Geometry }>;

function hasGeometry(node: SceneNode): node is GeometryNode {
  return "geometry" in node;
}

export function PresenceOverlay({ design, presences }: { design: DesignFile; presences: readonly PresenceState[] }) {
  return (
    <g data-testid="presence-overlay" pointerEvents="none">
      {presences.map((presence) => (
        <g data-presence-client-id={presence.clientId} key={presence.clientId}>
          {presence.selectedIds.map((nodeId: NodeId) => {
            const node = design.nodes[nodeId];
            if (!node || !hasGeometry(node)) {
              return null;
            }
            return (
              <rect
                data-testid="remote-selection"
                fill="none"
                height={node.geometry.height}
                key={nodeId}
                stroke={presence.actor.color}
                strokeDasharray="3 3"
                strokeWidth={2}
                width={node.geometry.width}
                x={node.geometry.x}
                y={node.geometry.y}
              />
            );
          })}
          {presence.cursor ? (
            <g data-testid="remote-cursor" transform={`translate(${presence.cursor.x} ${presence.cursor.y})`}>
              <path d="M0 0 0 20 5 15 9 24 13 22 9 13 16 13z" fill={presence.actor.color} stroke="#ffffff" strokeWidth={1.5} />
              <text fill={presence.actor.color} fontSize={12} fontWeight={700} x={14} y={24}>
                {presence.actor.name}
              </text>
            </g>
          ) : null}
        </g>
      ))}
    </g>
  );
}
