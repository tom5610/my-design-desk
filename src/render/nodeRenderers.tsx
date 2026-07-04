import type { DesignFile, Fill, Geometry, NodeId, NodeStyle, SceneNode } from "../model";
import { resolveComponentInstance } from "../model";

function solidFill(fills: readonly Fill[]) {
  const fill = fills.find((candidate) => candidate.kind === "solid");
  return fill?.kind === "solid" ? fill.color : "#ffffff";
}

function commonNodeProps(node: SceneNode, selectionNodeId = node.id) {
  return {
    "data-node-id": selectionNodeId,
    "data-node-kind": node.kind,
    "data-node-name": node.name,
    "data-render-node-id": node.id,
  };
}

function rectProps(geometry: Geometry, style: NodeStyle) {
  return {
    x: geometry.x,
    y: geometry.y,
    width: geometry.width,
    height: geometry.height,
    rx: style.radius ?? 0,
    fill: solidFill(style.fills),
    opacity: style.opacity,
    stroke: style.stroke?.color ?? "none",
    strokeWidth: style.stroke?.width ?? 0,
  };
}

function renderChildren(design: DesignFile, nodes: Record<NodeId, SceneNode>, nodeIds: readonly NodeId[], selectionNodeId?: NodeId) {
  return nodeIds.map((nodeId) => renderNodeFromMap(design, nodes, nodeId, selectionNodeId));
}

function renderNodeFromMap(design: DesignFile, nodes: Record<NodeId, SceneNode>, nodeId: NodeId, selectionNodeId?: NodeId): React.ReactNode {
  const node = nodes[nodeId];
  if (!node || !node.visible) {
    return null;
  }

  switch (node.kind) {
    case "Frame":
      return (
        <g key={node.id} {...commonNodeProps(node, selectionNodeId)}>
          <rect {...rectProps(node.geometry, node.style)} />
          {renderChildren(design, nodes, node.children, selectionNodeId)}
        </g>
      );
    case "Group":
      return (
        <g key={node.id} {...commonNodeProps(node, selectionNodeId)}>
          {renderChildren(design, nodes, node.children, selectionNodeId)}
        </g>
      );
    case "Rectangle":
      return <rect key={node.id} {...commonNodeProps(node, selectionNodeId)} {...rectProps(node.geometry, node.style)} />;
    case "Ellipse":
      return (
        <ellipse
          key={node.id}
          {...commonNodeProps(node, selectionNodeId)}
          cx={node.geometry.x + node.geometry.width / 2}
          cy={node.geometry.y + node.geometry.height / 2}
          rx={node.geometry.width / 2}
          ry={node.geometry.height / 2}
          fill={solidFill(node.style.fills)}
          opacity={node.style.opacity}
          stroke={node.style.stroke?.color ?? "none"}
          strokeWidth={node.style.stroke?.width ?? 0}
        />
      );
    case "Line":
      return (
        <line
          key={node.id}
          {...commonNodeProps(node, selectionNodeId)}
          x1={node.start.x}
          y1={node.start.y}
          x2={node.end.x}
          y2={node.end.y}
          stroke={node.stroke.color}
          strokeWidth={node.stroke.width}
        />
      );
    case "Text":
      return (
        <text
          key={node.id}
          {...commonNodeProps(node, selectionNodeId)}
          x={node.geometry.x}
          y={node.geometry.y + node.textStyle.fontSize}
          fill={node.textStyle.color}
          fontFamily={node.textStyle.fontFamily}
          fontSize={node.textStyle.fontSize}
          fontWeight={node.textStyle.fontWeight}
        >
          {node.text}
        </text>
      );
    case "Image":
      return (
        <g key={node.id} {...commonNodeProps(node, selectionNodeId)}>
          <rect {...rectProps(node.geometry, node.style)} fill="#e0f2fe" />
          <text x={node.geometry.x + 16} y={node.geometry.y + 32} fill="#0369a1" fontSize={14} fontWeight={700}>
            Image
          </text>
        </g>
      );
    case "Button":
      return (
        <g key={node.id} {...commonNodeProps(node, selectionNodeId)}>
          <rect {...rectProps(node.geometry, node.style)} />
          <text
            x={node.geometry.x + node.geometry.width / 2}
            y={node.geometry.y + node.geometry.height / 2 + node.textStyle.fontSize / 3}
            textAnchor="middle"
            fill={node.textStyle.color}
            fontSize={node.textStyle.fontSize}
            fontWeight={node.textStyle.fontWeight}
          >
            {node.label}
          </text>
          {renderChildren(design, nodes, node.children, selectionNodeId)}
        </g>
      );
    case "Icon":
      return (
        <path
          key={node.id}
          {...commonNodeProps(node, selectionNodeId)}
          d={node.svgPath}
          fill={node.color}
          transform={`translate(${node.geometry.x} ${node.geometry.y}) scale(${node.geometry.width / 24} ${node.geometry.height / 24})`}
        />
      );
    case "ChartPlaceholder":
      return (
        <g key={node.id} {...commonNodeProps(node, selectionNodeId)}>
          <rect {...rectProps(node.geometry, node.style)} />
          {[0, 1, 2, 3].map((index) => (
            <rect
              fill="#0f766e"
              height={42 + index * 22}
              key={index}
              opacity={0.22 + index * 0.12}
              rx={4}
              width={42}
              x={node.geometry.x + 42 + index * 70}
              y={node.geometry.y + 176 - index * 22}
            />
          ))}
        </g>
      );
    case "ComponentRoot":
      return (
        <g key={node.id} {...commonNodeProps(node, selectionNodeId)}>
          {renderChildren(design, nodes, node.children, selectionNodeId)}
        </g>
      );
    case "ComponentInstance": {
      const resolved = resolveComponentInstance(design, node);
      if (resolved) {
        return (
          <g key={node.id} {...commonNodeProps(node, selectionNodeId)}>
            {renderChildren(design, resolved.nodes, resolved.childIds, node.id)}
          </g>
        );
      }

      return (
        <g key={node.id} {...commonNodeProps(node, selectionNodeId)}>
          <rect x={node.geometry.x} y={node.geometry.y} width={node.geometry.width} height={node.geometry.height} rx={8} fill="#ffffff" stroke="#111827" />
          <text x={node.geometry.x + node.geometry.width / 2} y={node.geometry.y + 30} textAnchor="middle" fill="#111827" fontSize={16} fontWeight={700}>
            {String(node.overrides.label ?? "Instance")}
          </text>
        </g>
      );
    }
  }
}

export function renderNode(design: DesignFile, nodeId: NodeId): React.ReactNode {
  return renderNodeFromMap(design, design.nodes, nodeId);
}

export function SvgScene({ design }: { design: DesignFile }) {
  return <>{renderChildren(design, design.nodes, design.rootIds)}</>;
}
