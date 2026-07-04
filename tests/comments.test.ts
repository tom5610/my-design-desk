import { describe, expect, it } from "vitest";

import { createCommentReplyTransaction, createCommentResolvedTransaction, createCommentThreadTransaction } from "../src/commands";
import { createStarterDesign } from "../src/demo";
import { createDeterministicIdFactory, type DesignFile } from "../src/model";
import { applyOperations, type OperationMetadata } from "../src/ops";
import { commitTransaction, createHistoryState, undo } from "../src/store";
import { serializeDesign } from "../src/serialization";

function metadata(opId: string): OperationMetadata {
  return {
    opId,
    sessionId: "session_comments",
    clientId: "client_comments",
    actorId: "actor_comments",
    sequence: null,
    timestamp: "2026-07-04T09:00:00.000Z",
  };
}

function rootNodeId(design: DesignFile) {
  const rootId = design.rootIds[0];
  if (!rootId) {
    throw new Error("Missing root node");
  }
  return rootId;
}

describe("comment operations", () => {
  it("creates, replies to, and resolves comments deterministically", () => {
    const initial = createStarterDesign();
    const ids = createDeterministicIdFactory("comment-test");
    const commentId = ids.comment("hero");
    const create = createCommentThreadTransaction({
      author: "Reviewer",
      body: "Tighten this copy",
      commentId,
      createdAt: "2026-07-04T09:00:00.000Z",
      messageId: "message_1",
      metadata: metadata("create_comment"),
      nodeId: rootNodeId(initial),
      position: { x: 200, y: 220 },
    });
    const reply = createCommentReplyTransaction({
      author: "Designer",
      body: "Updated",
      commentId,
      createdAt: "2026-07-04T09:05:00.000Z",
      messageId: "message_2",
      metadata: metadata("reply_comment"),
    });
    const resolve = createCommentResolvedTransaction(commentId, true, metadata("resolve_comment"));
    const operations = [...create.operations, ...reply.operations, ...resolve.operations];
    const next = applyOperations(initial, operations);

    expect(next.comments[commentId]?.messages).toHaveLength(2);
    expect(next.comments[commentId]?.resolved).toBe(true);
    expect(serializeDesign(next)).toBe(serializeDesign(applyOperations(createStarterDesign(), operations)));
  });

  it("undoes comment creation", () => {
    const initial = createStarterDesign();
    const ids = createDeterministicIdFactory("comment-undo");
    const commentId = ids.comment("hero");
    const transaction = createCommentThreadTransaction({
      author: "Reviewer",
      body: "Add detail here",
      commentId,
      createdAt: "2026-07-04T09:00:00.000Z",
      messageId: "message_1",
      metadata: metadata("create_comment"),
      nodeId: rootNodeId(initial),
      position: { x: 300, y: 360 },
    });
    const committed = commitTransaction(createHistoryState(initial), transaction);
    const undone = undo(committed);

    expect(committed.present.comments[commentId]).toBeDefined();
    expect(undone.present.comments[commentId]).toBeUndefined();
    expect(serializeDesign(undone.present)).toBe(serializeDesign(initial));
  });
});
