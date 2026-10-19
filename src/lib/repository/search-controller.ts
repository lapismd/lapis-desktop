import {
  initialSearchState,
  type HistorySearchState,
  type HistorySearchService,
  type HistorySearchQuery,
} from "./search.ts";
/** Owns page lifetime and fixed-anchor continuation, separately from UI input. */
export class HistorySearchController {
  #state = initialSearchState();
  #listeners = new Set<(state: HistorySearchState) => void>();
  #epoch = 0;
  #closed = false;
  #query: HistorySearchQuery = { text: "" };
  #tail: Promise<unknown> = Promise.resolve();
  constructor(
    readonly service: HistorySearchService,
    readonly feedback: { report(error: unknown): void; recovered(): void },
  ) {}
  subscribe(listener: (state: HistorySearchState) => void) {
    this.#listeners.add(listener);
    listener(this.#state);
    return () => this.#listeners.delete(listener);
  }
  #set(patch: Partial<HistorySearchState>) {
    if (this.#closed) return;
    this.#state = { ...this.#state, ...patch };
    for (const listener of this.#listeners) listener(this.#state);
  }
  search(query: HistorySearchQuery): Promise<void> {
    if (this.#closed) return Promise.resolve();
    this.#query = { ...query };
    this.#set(initialSearchState());
    return this.#run(false);
  }
  more(): Promise<void> {
    if (this.#closed || this.#state.busy || !this.#state.next)
      return Promise.resolve();
    return this.#run(true);
  }
  #run(append: boolean) {
    const epoch = ++this.#epoch,
      query = { ...this.#query };
    const previous = this.#tail;
    this.#set({ busy: true, phase: "searching" });
    const job = (async () => {
      // An obsolete native page still drains. Avoid overlapping the one worker.
      await previous;
      if (this.#closed || epoch !== this.#epoch) return;
      let cursor = append ? this.#state.next : undefined;
      let hits = append ? this.#state.hits : [];
      let unindexed = append ? this.#state.unindexed : 0;
      const before = hits.length;
      const seen = new Set(hits.map(key));
      try {
        const cursors = new Set<string>();
        for (let n = 0; n < 32; n++) {
          const page = await this.service.page({ query, cursor });
          if (this.#closed || epoch !== this.#epoch) return;
          for (const hit of page.hits) {
            const identity = key(hit);
            if (!seen.has(identity)) {
              seen.add(identity);
              hits = [...hits, hit];
            }
          }
          unindexed += page.unindexed;
          this.#set({
            hits,
            unindexed,
            next: page.next,
            checkpoints: page.checkpoints,
            searched: true,
          });
          cursor = page.next;
          if (!cursor || hits.length >= before + 100) break;
          const identity = JSON.stringify(cursor);
          if (cursors.has(identity))
            throw new Error("History search returned a repeated cursor");
          cursors.add(identity);
        }
        this.feedback.recovered();
      } catch (error) {
        if (!this.#closed && epoch === this.#epoch) this.feedback.report(error);
      } finally {
        if (epoch === this.#epoch) this.#set({ busy: false, phase: "ready" });
      }
    })();
    return (this.#tail = job);
  }
  close() {
    this.#closed = true;
    this.#epoch++;
    this.#listeners.clear();
  }
  async drained() {
    await this.#tail;
  }
}
const key = (hit: import("./search.ts").HistorySearchHit) =>
  `${hit.revision.checkpoint.commit}/${hit.path ?? ""}`;
