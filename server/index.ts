import { createServer, type Server as HttpServer } from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { WebSocketServer, type RawData, type WebSocket } from "ws";

import type { ClientMessage, PresenceState, ServerMessage } from "../src/collab/messages.js";
import { LocalSessionStore } from "./sessions.js";

export type DesignDeskServer = {
  httpServer: HttpServer;
  close: () => Promise<void>;
};

export type DesignDeskServerOptions = {
  dataDir: string;
  host?: string;
  port?: number;
};

type ConnectionState = {
  sessionId: string;
  clientId?: string;
};

const defaultHost = "127.0.0.1";
const defaultPort = 8787;

const sockets = new Map<WebSocket, ConnectionState>();
const presenceBySession = new Map<string, Map<string, PresenceState>>();

function send(socket: WebSocket, message: ServerMessage) {
  socket.send(JSON.stringify(message));
}

function broadcast(sessionId: string, message: ServerMessage, except?: WebSocket) {
  for (const [socket, state] of sockets) {
    if (socket !== except && state.sessionId === sessionId && socket.readyState === socket.OPEN) {
      send(socket, message);
    }
  }
}

function decodeMessage(rawMessage: RawData) {
  if (typeof rawMessage === "string") {
    return rawMessage;
  }

  if (Array.isArray(rawMessage)) {
    return Buffer.concat(rawMessage).toString("utf8");
  }

  if (rawMessage instanceof ArrayBuffer) {
    return Buffer.from(new Uint8Array(rawMessage)).toString("utf8");
  }

  return rawMessage.toString("utf8");
}

function sessionPresence(sessionId: string) {
  const existing = presenceBySession.get(sessionId);
  if (existing) {
    return existing;
  }

  const next = new Map<string, PresenceState>();
  presenceBySession.set(sessionId, next);
  return next;
}

function parseSessionId(url: string | undefined) {
  if (!url) {
    return "local-demo";
  }

  const parsed = new URL(url, "http://127.0.0.1");
  return parsed.searchParams.get("sessionId") ?? "local-demo";
}

export function createDesignDeskServer(options: DesignDeskServerOptions): DesignDeskServer {
  const store = new LocalSessionStore({ dataDir: options.dataDir });
  const httpServer = createServer((request, response) => {
    if (request.url === "/health") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ ok: true, service: "design-desk-server" }));
      return;
    }

    response.writeHead(404, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "not_found" }));
  });

  const wss = new WebSocketServer({ server: httpServer });

  wss.on("connection", (socket, request) => {
    const requestUrl = new URL(request.url ?? "/collaboration", "http://127.0.0.1");
    if (requestUrl.pathname !== "/collaboration") {
      socket.close(1008, "Unsupported WebSocket path");
      return;
    }

    const sessionId = parseSessionId(request.url);
    sockets.set(socket, { sessionId });

    void store.loadSession(sessionId).then((session) => {
      send(socket, {
        type: "server.ready",
        sessionId,
        nextSequence: session.nextSequence,
        operationCount: session.operations.length,
      });
    });

    socket.on("message", (rawMessage) => {
      void handleClientMessage(store, socket, JSON.parse(decodeMessage(rawMessage)) as ClientMessage);
    });

    socket.on("close", () => {
      const state = sockets.get(socket);
      sockets.delete(socket);
      if (!state?.clientId) {
        return;
      }

      sessionPresence(state.sessionId).delete(state.clientId);
      broadcast(state.sessionId, {
        type: "presence.left",
        sessionId: state.sessionId,
        clientId: state.clientId,
      });
    });
  });

  return {
    httpServer,
    close: () =>
      new Promise((resolve, reject) => {
        for (const socket of sockets.keys()) {
          socket.terminate();
        }

        wss.close((webSocketError) => {
          if (webSocketError) {
            reject(webSocketError);
            return;
          }

          httpServer.close((httpError) => {
            if (httpError) {
              reject(httpError);
              return;
            }

            resolve();
          });
        });
      }),
  };
}

async function handleClientMessage(store: LocalSessionStore, socket: WebSocket, message: ClientMessage) {
  const state = sockets.get(socket);
  if (!state || state.sessionId !== message.sessionId) {
    return;
  }

  if (message.type === "presence.hello") {
    state.clientId = message.clientId;
    for (const existingPresence of sessionPresence(message.sessionId).values()) {
      send(socket, { type: "presence.updated", sessionId: message.sessionId, presence: existingPresence });
    }
    const presence: PresenceState = {
      clientId: message.clientId,
      actor: message.actor,
      selectedIds: [],
    };
    sessionPresence(message.sessionId).set(message.clientId, presence);
    broadcast(message.sessionId, { type: "presence.joined", sessionId: message.sessionId, presence }, socket);
    send(socket, { type: "presence.updated", sessionId: message.sessionId, presence });
    return;
  }

  if (message.type === "presence.update") {
    const current = sessionPresence(message.sessionId).get(message.clientId);
    if (!current) {
      return;
    }

    const presence: PresenceState = {
      ...current,
      cursor: message.cursor,
      selectedIds: message.selectedIds,
    };
    sessionPresence(message.sessionId).set(message.clientId, presence);
    broadcast(message.sessionId, { type: "presence.updated", sessionId: message.sessionId, presence }, socket);
    return;
  }

  try {
    const operation = await store.appendOperation(message.sessionId, message.operation);
    const serverMessage: ServerMessage = {
      type: "operation.committed",
      sessionId: message.sessionId,
      operation,
    };
    send(socket, serverMessage);
    broadcast(message.sessionId, serverMessage, socket);
  } catch (error) {
    send(socket, {
      type: "operation.rejected",
      sessionId: message.sessionId,
      opId: message.operation.opId,
      reason: error instanceof Error ? error.message : "Unknown operation error",
    });
  }
}

export async function startDesignDeskServer(options: DesignDeskServerOptions) {
  const server = createDesignDeskServer(options);
  const host = options.host ?? defaultHost;
  const port = options.port ?? defaultPort;

  await new Promise<void>((resolve) => {
    server.httpServer.listen(port, host, resolve);
  });

  const address = server.httpServer.address();
  const actualPort = typeof address === "object" && address ? address.port : port;
  console.log(`Design Desk collaboration server listening on http://${host}:${actualPort}`);
  return server;
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : undefined;

if (invokedPath === import.meta.url) {
  const dataDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "data");
  void startDesignDeskServer({
    dataDir,
    host: process.env.DESIGN_DESK_SERVER_HOST ?? defaultHost,
    port: Number.parseInt(process.env.DESIGN_DESK_SERVER_PORT ?? `${defaultPort}`, 10),
  });
}
