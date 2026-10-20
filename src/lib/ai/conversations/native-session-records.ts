import type { CanonicalReadLease } from "./canonical-catalog.ts";
import type {
  NativeRecord,
  NativeRecordPage,
  NativeRecordRef,
  NativeSessionRecordSource,
} from "./native-records.ts";

const MAX_REFERENCES = 65_536;
const MAX_RETAINED_BYTES = 32 * 1024 * 1024;
const budgets = new WeakMap<
  CanonicalReadLease,
  { bytes: number; records: number }
>();
export const nativeRecordKey = (value: NativeRecordRef) =>
  `${value.kind}:${value.id}`;
function dependencies(record: NativeRecord): NativeRecordRef[] {
  const p = record.projection;
  switch (p.type) {
    case "event_batch":
      return [
        p.value.evidence,
        ...p.value.events.flatMap((e) =>
          e.type === "message_completed" ? [e.content] : [],
        ),
      ];
    case "tool_snapshot":
      return [
        ...(p.value.input ? [p.value.input] : []),
        ...(p.value.output ? [p.value.output] : []),
        ...p.value.evidence,
      ];
    case "content":
    case "observation_batch":
      return [];
  }
}
export type NativeSessionRecordsState = {
  phase: "idle" | "loading" | "ready" | "error";
  complete: boolean;
  loaded: number;
  nextAfterIndex: number | null;
  error?: string;
};

/** Immutable read cache, scoped to one issued linked-session cursor. No writer/fallback. */
export class NativeSessionRecords {
  readonly #source: NativeSessionRecordSource;
  readonly #records = new Map<string, NativeRecord>();
  readonly #pages: string[] = [];
  readonly #listeners = new Set<(state: NativeSessionRecordsState) => void>();
  #reachable: Set<string>;
  #state: NativeSessionRecordsState = {
    phase: "idle",
    complete: false,
    loaded: 0,
    nextAfterIndex: 0,
  };
  #pending?: Promise<void>;
  constructor(
    private readonly lease: CanonicalReadLease,
    cursor: string,
  ) {
    const source = lease.read.recordSources.find((v) => v.cursor === cursor);
    if (!source)
      throw new Error(
        "Choose a linked session from this retained conversation",
      );
    this.#source = structuredClone(source);
    this.#reachable = new Set(
      [
        ...source.eventBatches,
        ...Object.values(source.tools),
        ...source.evidence,
      ].map(nativeRecordKey),
    );
    if (this.#reachable.size > MAX_REFERENCES)
      throw new Error("Conversation record inventory limit exceeded");
    if (!budgets.has(lease)) budgets.set(lease, { bytes: 0, records: 0 });
  }
  get source(): NativeSessionRecordSource {
    return structuredClone(this.#source);
  }
  get state(): NativeSessionRecordsState {
    return { ...this.#state };
  }
  get pages(): readonly string[] {
    return [...this.#pages];
  }
  record(reference: NativeRecordRef): NativeRecord | undefined {
    const record = this.#records.get(nativeRecordKey(reference));
    return record ? structuredClone(record) : undefined;
  }
  subscribe(listener: (state: NativeSessionRecordsState) => void): () => void {
    this.#listeners.add(listener);
    listener(this.state);
    return () => {
      this.#listeners.delete(listener);
    };
  }
  #publish(state: NativeSessionRecordsState) {
    this.#state = state;
    for (const listener of this.#listeners) listener(this.state);
  }
  loadMore(): Promise<void> {
    if (this.#pending) return this.#pending;
    const after = this.#state.nextAfterIndex;
    if (after === null) return Promise.resolve();
    this.#publish({ ...this.#state, phase: "loading", error: undefined });
    const pending = Promise.resolve()
      .then(() => this.lease.records(this.#source.cursor, after))
      .then((page) => {
        this.#accept(page, after);
      })
      .catch((error: unknown) => {
        this.#publish({
          ...this.#state,
          phase: "error",
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      });
    this.#pending = pending;
    void pending.then(
      () => {
        this.#pending = undefined;
      },
      () => {
        this.#pending = undefined;
      },
    );
    return pending;
  }
  async loadAll(): Promise<void> {
    while (!this.#state.complete) await this.loadMore();
  }
  #accept(page: NativeRecordPage, after: number) {
    if (
      page.sessionId !== this.#source.sessionId ||
      page.cursor !== this.#source.cursor ||
      page.afterIndex !== after ||
      (page.nextAfterIndex !== null &&
        page.nextAfterIndex !== after + page.records.length)
    )
      throw new Error(
        "Conversation records changed their session or continuation",
      );
    const reachable = new Set(this.#reachable),
      fresh = new Map<string, NativeRecord>();
    for (const record of page.records) {
      const key = nativeRecordKey(record.reference);
      if (!reachable.has(key) || fresh.has(key) || this.#records.has(key))
        throw new Error(
          "Conversation records returned unrelated or repeated content",
        );
      fresh.set(key, structuredClone(record));
      for (const dependency of dependencies(record))
        reachable.add(nativeRecordKey(dependency));
      if (reachable.size > MAX_REFERENCES)
        throw new Error("Conversation record inventory limit exceeded");
      if (record.projection.type === "tool_snapshot") {
        const tool = record.projection.value,
          expected = this.#source.tools[tool.tool_call_id];
        if (
          !expected ||
          nativeRecordKey(expected) !== key ||
          tool.session_id !== this.#source.sessionId
        )
          throw new Error(
            "Conversation tool snapshot changed its native identity",
          );
      }
    }
    const loaded = this.#records.size + fresh.size;
    if (
      (!page.records.length && page.nextAfterIndex !== null) ||
      (page.nextAfterIndex === null && loaded !== reachable.size)
    )
      throw new Error("Conversation record closure is incomplete");
    const bytes = new TextEncoder().encode(page.source).byteLength,
      budget = budgets.get(this.lease)!;
    if (
      budget.bytes + bytes > MAX_RETAINED_BYTES ||
      budget.records + fresh.size > MAX_REFERENCES
    )
      throw new Error("Retained conversation record cache limit exceeded");
    budget.bytes += bytes;
    budget.records += fresh.size;
    for (const [key, record] of fresh) this.#records.set(key, record);
    this.#reachable = reachable;
    this.#pages.push(page.source);
    this.#publish({
      phase: "ready",
      loaded,
      complete: page.nextAfterIndex === null,
      nextAfterIndex: page.nextAfterIndex,
    });
  }
}
