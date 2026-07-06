import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { createStarterDesign } from "../src/demo/index.js";
import type { DesignFile } from "../src/model/index.js";
import { applyOperation } from "../src/ops/apply.js";
import type { DesignOperation } from "../src/ops/types.js";

export type PersistedSession = {
  sessionId: string;
  design: DesignFile;
  operations: readonly DesignOperation[];
  nextSequence: number;
  updatedAt: string;
};

export type SessionStoreOptions = {
  dataDir: string;
};

export class LocalSessionStore {
  private readonly sessionsDir: string;
  private readonly cache = new Map<string, PersistedSession>();

  constructor(options: SessionStoreOptions) {
    this.sessionsDir = path.join(options.dataDir, "sessions");
  }

  async loadSession(sessionId: string): Promise<PersistedSession> {
    const cached = this.cache.get(sessionId);
    if (cached) {
      return cached;
    }

    const filePath = this.sessionPath(sessionId);

    try {
      const raw = await readFile(filePath, "utf8");
      const session = JSON.parse(raw) as PersistedSession;
      this.cache.set(sessionId, session);
      return session;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT" && error instanceof SyntaxError) {
        await this.quarantineCorruptSession(filePath);
      } else if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }

    const now = new Date(0).toISOString();
    const session: PersistedSession = {
      sessionId,
      design: createStarterDesign(),
      operations: [],
      nextSequence: 1,
      updatedAt: now,
    };
    await this.saveSession(session);
    return session;
  }

  async appendOperation(sessionId: string, operation: DesignOperation): Promise<DesignOperation & { sequence: number }> {
    const session = await this.loadSession(sessionId);

    if (session.operations.some((existing) => existing.opId === operation.opId)) {
      throw new Error(`Duplicate operation id ${operation.opId}`);
    }

    const sequencedOperation: DesignOperation & { sequence: number } = {
      ...operation,
      sequence: session.nextSequence,
    };
    const appliedDesign = applyOperation(session.design, sequencedOperation);
    const operations = [...session.operations, sequencedOperation];
    const nextSession: PersistedSession = {
      ...session,
      design: {
        ...appliedDesign,
        ops: operations,
      },
      operations,
      nextSequence: session.nextSequence + 1,
      updatedAt: sequencedOperation.timestamp,
    };

    await this.saveSession(nextSession);
    return sequencedOperation;
  }

  private sessionPath(sessionId: string) {
    const safeSessionId = sessionId.replace(/[^a-zA-Z0-9_-]/g, "_");
    return path.join(this.sessionsDir, `${safeSessionId}.json`);
  }

  private async saveSession(session: PersistedSession) {
    await mkdir(this.sessionsDir, { recursive: true });
    const filePath = this.sessionPath(session.sessionId);
    const tempPath = `${filePath}.${process.pid}.tmp`;
    await writeFile(tempPath, `${JSON.stringify(session, null, 2)}\n`, "utf8");
    await rename(tempPath, filePath);
    this.cache.set(session.sessionId, session);
  }

  private async quarantineCorruptSession(filePath: string) {
    try {
      await rename(filePath, `${filePath}.corrupt-${Date.now()}`);
    } catch {
      // Fall through to a fresh starter session even if quarantine fails.
    }
  }
}
