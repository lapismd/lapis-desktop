import type { TerminalClient, TerminalSession } from "@lapismd/terminal";
import { TerminalError } from "@lapismd/terminal";

export type TerminalLeaveMode = "close" | "reload";
export interface TerminalBackend {
  client: TerminalClient;
  activate(): Promise<void>;
  /** Close confirms scoped process shutdown; reload preserves retained shells. */
  release(mode: TerminalLeaveMode): Promise<void>;
}

/** App-owned sessions outlive presentation mounts; native admission owns PTYs. */
export class TerminalSessions {
  readonly client: TerminalClient;
  #backend: TerminalBackend;
  #admission?: Promise<void>;
  #sessions = new Map<string, TerminalSession>();
  #requested = new Set<string>();
  #opening = new Map<string, Promise<TerminalSession>>();
  #leaving?: TerminalLeaveMode;
  #shutdown?: Promise<void>;

  constructor(backend: TerminalBackend) {
    this.#backend = backend;
    this.client = backend.client;
  }

  async #activate(): Promise<void> {
    if (this.#leaving) throw new Error("Terminal is disabled");
    this.#admission ??= this.#backend.activate().catch((error) => {
      this.#admission = undefined;
      throw error;
    });
    await this.#admission;
  }

  async restore(id?: string): Promise<TerminalSession | undefined> {
    if (!id) return undefined;
    await this.#activate();
    const existing = this.#sessions.get(id);
    if (existing) return existing;
    const info = (await this.client.list()).find((value) => value.id === id);
    if (!info) return undefined;
    const session = this.client.session(info);
    this.#sessions.set(id, session);
    return session;
  }

  start(requestId: string): Promise<TerminalSession> {
    if (this.#leaving) return Promise.reject(new Error("Terminal is disabled"));
    const existing = this.#sessions.get(requestId);
    if (existing) return Promise.resolve(existing);
    const pending = this.#opening.get(requestId);
    if (pending) return pending;
    this.#requested.add(requestId);
    const task = (async () => {
      await this.#activate();
      const [target] = await this.client.targets();
      if (!target) throw new Error("No admitted terminal target is available");
      const session = await this.client.open({
        targetId: target.id,
        requestId,
      });
      this.#sessions.set(session.id, session);
      return session;
    })().finally(() => this.#opening.delete(requestId));
    this.#opening.set(requestId, task);
    return task;
  }

  async close(id: string): Promise<void> {
    if (this.#leaving) return;
    const session = this.#sessions.get(id) ?? (await this.#opening.get(id));
    if (!session) {
      if (this.#requested.has(id)) await this.client.transport.close(id);
    } else await session.close();
    this.#sessions.delete(id);
    this.#requested.delete(id);
  }

  prepareLeave(mode: TerminalLeaveMode): void {
    this.#leaving = mode;
  }

  dispose(mode = this.#leaving ?? "close"): Promise<void> {
    if (this.#shutdown) return this.#shutdown;
    this.prepareLeave(mode);
    this.#shutdown = (async () => {
      await Promise.allSettled(this.#opening.values());
      const results = await Promise.allSettled(
        [...this.#sessions.values()].map((session) =>
          mode === "reload" ? session.detach() : session.close(),
        ),
      );
      this.#sessions.clear();
      this.#requested.clear();
      let released = false;
      try {
        await this.#backend.release(mode);
        released = true;
      } catch (error) {
        results.push({ status: "rejected", reason: error });
      }
      const failures = results.flatMap((result) => {
        if (result.status === "fulfilled") return [];
        // Revoked IPC stays denied; the host separately confirms scoped shutdown.
        if (
          mode === "close" &&
          released &&
          result.reason instanceof TerminalError &&
          result.reason.code === "denied"
        )
          return [];
        return [result.reason];
      });
      if (failures.length)
        throw new AggregateError(
          failures,
          `Terminal cleanup failed: ${failures.map(String).join("; ")}`,
        );
    })().catch((error) => {
      this.#shutdown = undefined;
      throw error;
    });
    return this.#shutdown;
  }
}
