import type { SnapGuide } from "../../../geometry";

export function GuideOverlay({ guides }: { guides: readonly SnapGuide[] }) {
  if (guides.length === 0) {
    return null;
  }

  return (
    <g data-testid="guide-overlay" pointerEvents="none">
      {guides.map((guide) => {
        const isVertical = guide.orientation === "vertical";
        return (
          <g data-guide-kind={guide.kind} key={guide.id}>
            <line
              data-testid="snapping-guide"
              stroke={guide.kind === "spacing" ? "#0f766e" : "#db2777"}
              strokeDasharray={guide.kind === "grid" ? "4 4" : guide.kind === "spacing" ? "2 3" : undefined}
              strokeWidth={1.5}
              x1={isVertical ? guide.position : guide.start}
              x2={isVertical ? guide.position : guide.end}
              y1={isVertical ? guide.start : guide.position}
              y2={isVertical ? guide.end : guide.position}
            />
            {guide.label ? (
              <text
                fill="#0f766e"
                fontSize={12}
                fontWeight={700}
                paintOrder="stroke"
                stroke="#ffffff"
                strokeWidth={3}
                textAnchor="middle"
                x={isVertical ? guide.position + 18 : (guide.start + guide.end) / 2}
                y={isVertical ? (guide.start + guide.end) / 2 : guide.position - 8}
              >
                {guide.label}
              </text>
            ) : null}
          </g>
        );
      })}
    </g>
  );
}
