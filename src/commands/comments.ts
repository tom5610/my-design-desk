import type { CommentId, CommentThread, NodeId, Point } from "../model";
import { createTransaction, type OperationMetadata, type Transaction } from "../ops";

export function createCommentThreadTransaction({
  author,
  body,
  commentId,
  createdAt,
  messageId,
  metadata,
  nodeId,
  position,
}: {
  author: string;
  body: string;
  commentId: CommentId;
  createdAt: string;
  messageId: string;
  metadata: OperationMetadata;
  nodeId: NodeId;
  position: Point;
}): Transaction {
  const thread: CommentThread = {
    id: commentId,
    nodeId,
    position,
    resolved: false,
    messages: [
      {
        id: messageId,
        author,
        body,
        createdAt,
      },
    ],
  };

  return createTransaction("tx_create_comment", "Create comment", [
    {
      ...metadata,
      kind: "comment.create",
      payload: { thread },
    },
  ]);
}

export function createCommentReplyTransaction({
  author,
  body,
  commentId,
  createdAt,
  messageId,
  metadata,
}: {
  author: string;
  body: string;
  commentId: CommentId;
  createdAt: string;
  messageId: string;
  metadata: OperationMetadata;
}): Transaction {
  return createTransaction("tx_reply_comment", "Reply to comment", [
    {
      ...metadata,
      kind: "comment.addMessage",
      payload: {
        commentId,
        message: {
          id: messageId,
          author,
          body,
          createdAt,
        },
      },
    },
  ]);
}

export function createCommentResolvedTransaction(commentId: CommentId, resolved: boolean, metadata: OperationMetadata): Transaction {
  return createTransaction("tx_resolve_comment", resolved ? "Resolve comment" : "Reopen comment", [
    {
      ...metadata,
      kind: "comment.setResolved",
      payload: {
        commentId,
        resolved,
      },
    },
  ]);
}
