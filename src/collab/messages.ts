import type { NodeId } from "../model";
import type { DesignOperation } from "../ops";

export type PresenceActor = {
  id: string;
  name: string;
  color: string;
};

export type PresenceState = {
  clientId: string;
  actor: PresenceActor;
  cursor?: {
    x: number;
    y: number;
  };
  selectedIds: readonly NodeId[];
};

export type ClientMessage =
  | {
      type: "presence.hello";
      sessionId: string;
      clientId: string;
      actor: PresenceActor;
    }
  | {
      type: "presence.update";
      sessionId: string;
      clientId: string;
      cursor?: {
        x: number;
        y: number;
      };
      selectedIds: readonly NodeId[];
    }
  | {
      type: "operation.submit";
      sessionId: string;
      clientId: string;
      operation: DesignOperation;
    };

export type SequencedOperation = DesignOperation & {
  sequence: number;
};

export type ServerMessage =
  | {
      type: "server.ready";
      sessionId: string;
      nextSequence: number;
      operationCount: number;
    }
  | {
      type: "presence.joined";
      sessionId: string;
      presence: PresenceState;
    }
  | {
      type: "presence.updated";
      sessionId: string;
      presence: PresenceState;
    }
  | {
      type: "presence.left";
      sessionId: string;
      clientId: string;
    }
  | {
      type: "operation.committed";
      sessionId: string;
      operation: SequencedOperation;
    }
  | {
      type: "operation.rejected";
      sessionId: string;
      opId: string;
      reason: string;
    };
