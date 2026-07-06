import { CheckCircle2, LocateFixed, MessageSquare, RotateCcw, Send, X } from "lucide-react";
import { useState } from "react";

import type { CommentId, CommentThread } from "../model";

export function CommentsPanel({
  activeCommentId,
  author,
  comments,
  onAuthorChange,
  onClose,
  onJumpToComment,
  onReply,
  onResolve,
}: {
  activeCommentId: CommentId | null;
  author: string;
  comments: readonly CommentThread[];
  onAuthorChange: (author: string) => void;
  onClose: () => void;
  onJumpToComment: (commentId: CommentId) => void;
  onReply: (commentId: CommentId, body: string) => void;
  onResolve: (commentId: CommentId, resolved: boolean) => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  return (
    <aside className="absolute left-4 right-4 top-20 z-20 rounded border border-desk-line bg-white/95 shadow-panel sm:left-auto sm:right-4 sm:top-4 sm:w-[320px]" data-testid="comments-panel">
      <div className="flex items-center justify-between gap-2 border-b border-desk-line px-3 py-2">
        <div className="flex items-center gap-2">
          <MessageSquare size={15} aria-hidden="true" />
          <h2 className="text-sm font-semibold">Comments</h2>
        </div>
        <button aria-label="Close comments" className="flex size-7 items-center justify-center rounded hover:bg-slate-100" onClick={onClose} type="button">
          <X size={14} aria-hidden="true" />
        </button>
      </div>
      <div className="border-b border-desk-line p-3">
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-desk-muted">
          Author
          <input
            aria-label="Comment author"
            className="mt-1 w-full rounded border border-desk-line px-2 py-1.5 text-sm font-medium normal-case tracking-normal outline-none"
            onChange={(event) => onAuthorChange(event.target.value)}
            value={author}
          />
        </label>
      </div>
      <div className="max-h-[360px] space-y-2 overflow-auto p-3">
        {comments.length === 0 ? (
          <p className="text-sm text-desk-muted">No comments yet.</p>
        ) : (
          comments.map((comment, index) => {
            const draft = drafts[comment.id] ?? "";
            return (
              <article
                className={`rounded border px-3 py-2 text-sm ${activeCommentId === comment.id ? "border-pink-400 bg-pink-50" : "border-desk-line bg-white"}`}
                data-comment-card-id={comment.id}
                key={comment.id}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="font-semibold">Pin {index + 1}</span>
                  <span className={`text-[11px] font-semibold ${comment.resolved ? "text-slate-500" : "text-amber-700"}`}>
                    {comment.resolved ? "Resolved" : "Open"}
                  </span>
                </div>
                <div className="space-y-2">
                  {comment.messages.map((message) => (
                    <div className="rounded bg-slate-50 px-2 py-1.5" key={message.id}>
                      <div className="text-[11px] font-semibold text-desk-muted">{message.author}</div>
                      <div>{message.body}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex gap-1">
                  <button
                    aria-label={`Jump to comment ${index + 1}`}
                    className="flex size-8 items-center justify-center rounded bg-slate-100 hover:bg-slate-200"
                    onClick={() => onJumpToComment(comment.id)}
                    type="button"
                  >
                    <LocateFixed size={14} aria-hidden="true" />
                  </button>
                  <button
                    aria-label={comment.resolved ? `Reopen comment ${index + 1}` : `Resolve comment ${index + 1}`}
                    className="flex size-8 items-center justify-center rounded bg-slate-100 hover:bg-slate-200"
                    onClick={() => onResolve(comment.id, !comment.resolved)}
                    type="button"
                  >
                    {comment.resolved ? <RotateCcw size={14} aria-hidden="true" /> : <CheckCircle2 size={14} aria-hidden="true" />}
                  </button>
                </div>
                <form
                  className="mt-2 flex gap-1"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (draft.trim()) {
                      onReply(comment.id, draft.trim());
                      setDrafts((current) => ({ ...current, [comment.id]: "" }));
                    }
                  }}
                >
                  <input
                    aria-label={`Reply to comment ${index + 1}`}
                    className="min-w-0 flex-1 rounded border border-desk-line px-2 py-1.5 text-sm outline-none"
                    onChange={(event) => setDrafts((current) => ({ ...current, [comment.id]: event.target.value }))}
                    value={draft}
                  />
                  <button className="flex size-8 items-center justify-center rounded bg-desk-ink text-white" type="submit">
                    <Send size={13} aria-hidden="true" />
                  </button>
                </form>
              </article>
            );
          })
        )}
      </div>
    </aside>
  );
}
