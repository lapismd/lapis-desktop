import type { TerminalSession } from "@lapismd/terminal";
import type { TerminalSessions } from "./terminal-sessions.ts";

export interface TerminalTabState {
  session?: TerminalSession;
  busy: boolean;
  error?: string;
}
export class TerminalTab {
  #state: TerminalTabState = { busy: false };
  #listeners = new Set<(state: TerminalTabState) => void>();
  #closed = false;
  #pending?: Promise<void>;
  #id?: string;
  #request?: string;

  private readonly sessions: TerminalSessions;
  private readonly changed: () => void;
  private readonly report: (error: unknown) => void;
  constructor(
    sessions: TerminalSessions,
    id: unknown,
    changed: () => void,
    report: (error: unknown) => void,
  ) {
    this.sessions = sessions;
    this.changed = changed;
    this.report = report;
    this.#id = typeof id === "string" ? id : undefined;
  }

  get id(): string | undefined {
    return this.#id;
  }
  get state(): TerminalTabState {
    return this.#state;
  }
  subscribe(listener: (state: TerminalTabState) => void): () => void {
    this.#listeners.add(listener);
    listener(this.#state);
    return () => {
      this.#listeners.delete(listener);
    };
  }
  #update(patch: Partial<TerminalTabState>): void {
    this.#state = { ...this.#state, ...patch };
    for (const listener of this.#listeners) listener(this.#state);
  }
  restore(): Promise<void> {
    return this.#run(async () => {
      const session = await this.sessions.restore(this.#id);
      if (!session) this.#id = undefined;
      this.#update({ session });
    });
  }
  start(): Promise<void> {
    return this.#run(async () => {
      this.#request ??= crypto.randomUUID();
      this.#id = this.#request;
      const session = await this.sessions.start(this.#id);
      this.#update({ session });
      this.changed();
    });
  }
  #run(action: () => Promise<void>): Promise<void> {
    if (this.#closed) return Promise.resolve();
    if (this.#pending) return this.#pending;
    this.#update({ busy: true, error: undefined });
    this.#pending = action()
      .catch((error) => {
        this.#update({
          error: error instanceof Error ? error.message : String(error),
        });
        this.report(error);
      })
      .finally(() => {
        this.#pending = undefined;
        this.#update({ busy: false });
      });
    return this.#pending;
  }
  async close(): Promise<void> {
    this.#closed = true;
    await this.#pending;
    if (this.#id) await this.sessions.close(this.#id);
    this.#listeners.clear();
  }
}
