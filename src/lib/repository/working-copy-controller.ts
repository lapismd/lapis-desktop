import type { WorkingCopyStatus } from "./working-copy-status.ts";
export type WorkingCopyState = {
  busy: boolean;
  status: "loading" | "ready" | "unavailable";
  value?: WorkingCopyStatus;
};
/** Coalesces refresh and fences results immediately on hide/plugin teardown. */
export class WorkingCopyController {
  #state: WorkingCopyState = { busy: false, status: "loading" };
  #listeners = new Set<(state: WorkingCopyState) => void>();
  #job?: Promise<void>;
  #closed = false;
  readonly read: () => Promise<WorkingCopyStatus>;
  readonly feedback: { report(error: unknown): void; recovered(): void };
  constructor(
    read: () => Promise<WorkingCopyStatus>,
    feedback: { report(error: unknown): void; recovered(): void },
  ) {
    this.read = read;
    this.feedback = feedback;
  }
  subscribe(listener: (state: WorkingCopyState) => void): () => void {
    this.#listeners.add(listener);
    listener(this.#state);
    return () => this.#listeners.delete(listener);
  }
  #set(state: WorkingCopyState) {
    this.#state = state;
    for (const listener of this.#listeners) listener(state);
  }
  refresh(): Promise<void> {
    if (this.#closed) return Promise.resolve();
    if (this.#job) return this.#job;
    this.#set({ ...this.#state, busy: true });
    const job = (async () => {
      try {
        const value = await this.read();
        if (this.#closed) return;
        this.feedback.recovered();
        this.#set({ busy: false, status: "ready", value });
      } catch (error) {
        if (this.#closed) return;
        // Never display old counts as current after a failed observation.
        this.#set({ busy: false, status: "unavailable" });
        this.feedback.report(error);
      }
    })();
    this.#job = job;
    void job.finally(() => {
      if (this.#job === job) this.#job = undefined;
    });
    return job;
  }
  async close(): Promise<void> {
    this.#closed = true;
    await this.#job;
    this.#set({ busy: false, status: "unavailable" });
    this.#listeners.clear();
  }
}
