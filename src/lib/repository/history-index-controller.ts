import type {
  HistoryIndexStatus,
  IndexedHistoryService,
} from "./indexed-search.ts";

export type HistoryIndexState = {
  busy: boolean;
  phase: string;
  status?: HistoryIndexStatus;
};
/** Observe cached vault-owned progress; no renderer request schedules a batch. */
export class HistoryIndexController {
  #closed = false;
  #started = false;
  #job?: Promise<void>;
  #timer?: ReturnType<typeof setTimeout>;
  #listeners = new Set<(state: HistoryIndexState) => void>();
  #state: HistoryIndexState = { busy: false, phase: "ready" };
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
  start() {
    if (this.#closed || this.#started) return;
    this.#started = true;
    this.#set({ busy: true, phase: "indexing" });
    this.#observe(true);
  }
  #observe(initial = false) {
    if (this.#closed || this.#job) return;
    this.#job = this.#read(initial).finally(() => {
      this.#job = undefined;
      if (!this.#closed) this.#timer = setTimeout(() => this.#observe(), 1000);
    });
  }
  async #read(initial: boolean) {
    try {
      const status = await (initial
        ? this.service.start()
        : this.service.status());
      if (this.#closed) return;
      this.#set({
        busy: !status.complete,
        phase: status.complete ? "ready" : "indexing",
        status,
      });
      this.#failure = "";
      this.feedback.recovered();
    } catch (error) {
      if (this.#closed) return;
      const message = String(error);
      if (message !== this.#failure) this.feedback.report(error);
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
