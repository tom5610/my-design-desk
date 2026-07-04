import { createServer } from "node:http";
import { WebSocketServer, type RawData, type WebSocket } from "ws";

const port = Number.parseInt(process.env.DESIGN_DESK_SERVER_PORT ?? "8787", 10);

type PresenceMessage = {
  type: "presence.hello";
  clientId: string;
  name: string;
};

type ServerMessage =
  | {
      type: "server.ready";
      sessionId: string;
    }
  | {
      type: "presence.joined";
      clientId: string;
      name: string;
    };

const sockets = new Set<WebSocket>();

function send(socket: WebSocket, message: ServerMessage) {
  socket.send(JSON.stringify(message));
}

function broadcast(message: ServerMessage, except?: WebSocket) {
  const payload = JSON.stringify(message);
  for (const socket of sockets) {
    if (socket !== except && socket.readyState === socket.OPEN) {
      socket.send(payload);
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

const httpServer = createServer((request, response) => {
  if (request.url === "/health") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: true, service: "design-desk-server" }));
    return;
  }

  response.writeHead(404, { "content-type": "application/json" });
  response.end(JSON.stringify({ error: "not_found" }));
});

const wss = new WebSocketServer({ server: httpServer, path: "/collaboration" });

wss.on("connection", (socket) => {
  sockets.add(socket);
  send(socket, { type: "server.ready", sessionId: "local-demo" });

  socket.on("message", (rawMessage) => {
    const parsed = JSON.parse(decodeMessage(rawMessage)) as Partial<PresenceMessage>;

    if (parsed.type === "presence.hello" && parsed.clientId && parsed.name) {
      broadcast(
        {
          type: "presence.joined",
          clientId: parsed.clientId,
          name: parsed.name,
        },
        socket,
      );
    }
  });

  socket.on("close", () => {
    sockets.delete(socket);
  });
});

httpServer.listen(port, "127.0.0.1", () => {
  console.log(`Design Desk collaboration server listening on http://127.0.0.1:${port}`);
});
