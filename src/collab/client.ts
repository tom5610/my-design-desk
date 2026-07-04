import type { ClientMessage, ServerMessage } from "./messages";

export type CollaborationClient = {
  close: () => void;
  send: (message: ClientMessage) => void;
};

export type CollaborationClientOptions = {
  onClose?: () => void;
  onError?: () => void;
  onOpen?: () => void;
};

export function connectCollaborationClient(url: string, onMessage: (message: ServerMessage) => void, options: CollaborationClientOptions = {}): CollaborationClient {
  const socket = new WebSocket(url);
  const queue: ClientMessage[] = [];

  socket.addEventListener("open", () => {
    options.onOpen?.();
    for (const message of queue.splice(0)) {
      socket.send(JSON.stringify(message));
    }
  });

  socket.addEventListener("message", (event) => {
    onMessage(JSON.parse(event.data as string) as ServerMessage);
  });

  socket.addEventListener("close", () => options.onClose?.());
  socket.addEventListener("error", () => options.onError?.());

  return {
    close: () => socket.close(),
    send: (message) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
        return;
      }
      queue.push(message);
    },
  };
}
