import type { ClientMessage, ServerMessage } from "./messages";

export type CollaborationClient = {
  close: () => void;
  send: (message: ClientMessage) => void;
};

export function connectCollaborationClient(url: string, onMessage: (message: ServerMessage) => void): CollaborationClient {
  const socket = new WebSocket(url);

  socket.addEventListener("message", (event) => {
    onMessage(JSON.parse(event.data as string) as ServerMessage);
  });

  return {
    close: () => socket.close(),
    send: (message) => socket.send(JSON.stringify(message)),
  };
}
