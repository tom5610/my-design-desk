import type { CommentId, CommentThread } from "../model";

export function CommentPinsOverlay({
  activeCommentId,
  comments,
  onSelectComment,
}: {
  activeCommentId: CommentId | null;
  comments: readonly CommentThread[];
  onSelectComment: (commentId: CommentId) => void;
}) {
  return (
    <g data-testid="comment-pins">
      {comments.map((comment, index) => (
        <g
          data-comment-id={comment.id}
          data-testid="comment-pin"
          key={comment.id}
          onPointerDown={(event) => {
            event.stopPropagation();
            onSelectComment(comment.id);
          }}
          transform={`translate(${comment.position.x} ${comment.position.y})`}
        >
          <circle
            fill={comment.resolved ? "#94a3b8" : activeCommentId === comment.id ? "#db2777" : "#f59e0b"}
            r={13}
            stroke="#ffffff"
            strokeWidth={3}
          />
          <text fill="#ffffff" fontSize={11} fontWeight={800} textAnchor="middle" y={4}>
            {index + 1}
          </text>
        </g>
      ))}
    </g>
  );
}
