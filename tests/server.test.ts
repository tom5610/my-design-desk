import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { WebSocket, type RawData } from "ws";
import { afterEach, describe, expect, it } from "vitest";

import type { ServerMessage } from "../src/collab/messages";
import type { DesignFile } from "../src/model";
import type { DesignOperation, OperationMetadata } from "../src/ops";
import { LocalSessionStore } from "../server/sessions";
import { createDesignDeskServer } from "../server/index";
import { createStarterDesign } from "../src/demo";
import { applyOperation } from "../src/ops";
import { serializeDesign } from "../src/serialization";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function makeTempDir() {
  const dir = await mkdtemp(path.join(tmpdir(), "design-desk-test-"));
  tempDirs.push(dir);
  return dir;
}

function metadata(opId: string): OperationMetadata {
  return {
    opId,
    sessionId: "session_test",
    clientId: "client_test",
    actorId: "actor_test",
    sequence: null,
    timestamp: "2026-07-04T02:00:00.000Z",
  };
}

function firstNodeId(design: DesignFile, name: string) {
  const node = Object.values(design.nodes).find((candidate) => candidate.name === name);
  if (!node) {
    throw new Error(`Missing node ${name}`);
  }
  return node.id;
}

function moveHeadline(design: DesignFile, opId = "op_move_headline"): DesignOperation {
  return {
    ...metadata(opId),
    kind: "node.updateGeometry",
    payload: {
      nodeId: firstNodeId(design, "Hero headline"),
      geometry: { x: 196, y: 212, width: 620, height: 156, rotation: 0 },
    },
  };
}

function nextMessage(socket: WebSocket) {
  return new Promise<ServerMessage>((resolve, reject) => {
    socket.once("error", reject);
    socket.once("close", () => reject(new Error("Socket closed before message")));
    socket.once("message", (raw) => {
      resolve(JSON.parse(decodeMessage(raw)) as ServerMessage);
    });
  });
}

function openSocket(url: string) {
  const socket = new WebSocket(url);
  return new Promise<WebSocket>((resolve, reject) => {
    socket.once("open", () => resolve(socket));
    socket.once("error", reject);
  });
}

function decodeMessage(raw: RawData) {
  if (typeof raw === "string") {
    return raw;
  }

  if (Array.isArray(raw)) {
    return Buffer.concat(raw).toString("utf8");
  }

  if (raw instanceof ArrayBuffer) {
    return Buffer.from(new Uint8Array(raw)).toString("utf8");
  }

  return raw.toString("utf8");
}

describe("LocalSessionStore", () => {
  it("creates sessions and persists sequenced operations in canonical order", async () => {
    const dataDir = await makeTempDir();
    const store = new LocalSessionStore({ dataDir });
    const session = await store.loadSession("local-demo");
    const operation = await store.appendOperation("local-demo", moveHeadline(session.design));

    expect(operation.sequence).toBe(1);
    const persisted = JSON.parse(await readFile(path.join(dataDir, "sessions", "local-demo.json"), "utf8")) as {
      operations: readonly DesignOperation[];
      nextSequence: number;
    };
    expect(persisted.nextSequence).toBe(2);
    expect(persisted.operations.map((entry) => entry.sequence)).toEqual([1]);
  });
});

describe("Design Desk WebSocket server", () => {
  it("sends ready and commits submitted operations with server sequence numbers", async () => {
    const dataDir = await makeTempDir();
    const server = createDesignDeskServer({ dataDir });

    await new Promise<void>((resolve, reject) => {
      server.httpServer.once("error", reject);
      server.httpServer.listen(0, "127.0.0.1", resolve);
    });
    const address = server.httpServer.address();
    const port = typeof address === "object" && address ? address.port : 0;

    let socket: WebSocket | undefined;

    try {
      socket = await openSocket(`ws://127.0.0.1:${port}/collaboration?sessionId=local-demo`);
      const ready = await nextMessage(socket);
      expect(ready).toMatchObject({ type: "server.ready", sessionId: "local-demo", nextSequence: 1 });

      socket.send(
        JSON.stringify({
          type: "presence.hello",
          sessionId: "local-demo",
          clientId: "client-a",
          actor: { id: "actor-a", name: "Ada", color: "#0f766e" },
        }),
      );
      expect(await nextMessage(socket)).toMatchObject({ type: "presence.updated", sessionId: "local-demo" });

      const store = new LocalSessionStore({ dataDir });
      const session = await store.loadSession("local-demo");
      socket.send(
        JSON.stringify({
          type: "operation.submit",
          sessionId: "local-demo",
          clientId: "client-a",
          operation: moveHeadline(session.design, "op_ws_move"),
        }),
      );

      const committed = await nextMessage(socket);
      expect(committed).toMatchObject({
        type: "operation.committed",
        sessionId: "local-demo",
        operation: { opId: "op_ws_move", sequence: 1 },
      });
    } finally {
      socket?.close();
      await server.close();
    }
  });

  it("applies server-sequenced operations deterministically across clients", () => {
    const initialA = createStarterDesign();
    const initialB = createStarterDesign();
    const operation = {
      ...moveHeadline(initialA, "op_two_client_move"),
      sequence: 1,
    };

    expect(serializeDesign(applyOperation(initialA, operation))).toBe(serializeDesign(applyOperation(initialB, operation)));
  });
});
