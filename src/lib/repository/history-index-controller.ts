import type {
  HistoryIndexStatus,
  IndexedHistoryService,
} from "./indexed-search.ts";

export type HistoryIndexState = {
  busy: boolean;
  phase: string;
  status?: HistoryIndexStatus;
};
/** Schedules disposable native batches; capture never waits for indexing. */
export class HistoryIndexController {
  #closed = false;
  #job?: Promise<void>;
  #timer?: ReturnType<typeof setTimeout>;
  #listeners = new Set<(state: HistoryIndexState) => void>();
  #state: HistoryIndexState = { busy: false, phase: "ready" };
  #again = false;
  #failure = "";
  constructor(
    readonly service: IndexedHistoryService,
    readonly feedback: { report(error: unknown): void; recovered(): void },
  ) {}
  subscribe(listener: (state: HistoryIndexState) => void) {
    this.#listeners.add(listener);
    listener(this.#state);
    return () => {
      this.#listeners.delete(listener);
    };
  }
  #set(state: HistoryIndexState) {
    if (this.#closed) return;
    this.#state = state;
    for (const listener of this.#listeners) listener(state);
  }
  schedule() {
    if (this.#closed) return;
    clearTimeout(this.#timer);
    if (this.#job) {
      this.#again = true;
      return;
    }
    this.#job = this.#run().finally(() => {
      this.#job = undefined;
      if (!this.#closed)
        this.#timer = setTimeout(
          () => this.schedule(),
          this.#again ? 0 : this.#failure ? 5000 : 60_000,
        );
      this.#again = false;
    });
  }
  async #run() {
    this.#set({ ...this.#state, busy: true, phase: "indexing" });
    try {
      while (!this.#closed) {
        const status = await this.service.step();
        if (this.#closed) return;
        this.#set({
          busy: !status.complete,
          phase: status.complete ? "ready" : "indexing",
          status,
        });
        if (status.complete) break;
        await new Promise((resolve) => setTimeout(resolve, 30));
      }
      this.#failure = "";
      this.feedback.recovered();
    } catch (error) {
      const message = String(error);
      if (!this.#closed && message !== this.#failure)
        this.feedback.report(error);
      this.#failure = message;
      this.#set({ ...this.#state, busy: false, phase: "paused" });
    }
  }
  async close() {
    this.#closed = true;
    clearTimeout(this.#timer);
    await this.#job;
    this.#listeners.clear();
  }
}
