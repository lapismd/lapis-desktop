import { OperationFiles } from "./operation-files.ts";
import type { Handle, LocalGraphOperationNode } from "@lapismd/jj-history";
import type { HistoryReader } from "./history-reader.ts";
import { HistoryLifetime } from "./history-lifetime.ts";
import { check, pause, prepared } from "./history-selection.ts";
import {
  initialOperationState,
  type OperationState,
} from "./operation-state.ts";

/** Independent operation-pinned reader; it shares no mutable history selection. */
export class OperationController {
  #state = initialOperationState();
  readonly files: OperationFiles;
  #listeners = new Set<(state: OperationState) => void>();
  readonly #lifetime: HistoryLifetime;
  #handle?: Handle;
  #selection = 0;
  #detail = 0;
  #request = 0;
  #abort = new AbortController();
  #closed = false;
  #closing?: Promise<void>;
  readonly reader: HistoryReader;
  readonly feedback: { report(error: unknown): void; recovered(): void };
  readonly wait: typeof pause;
  constructor(
    reader: HistoryReader,
    feedback: OperationController["feedback"],
    wait = pause,
  ) {
    this.files = new OperationFiles(
      async (query) => {
        check(this.#handle);
        return reader.read(this.#handle, query);
      },
      (action) => this.#run(action),
      (files) => this.#set({ files }),
    );
    this.reader = reader;
    this.feedback = feedback;
    this.wait = wait;
    this.#lifetime = new HistoryLifetime(reader);
  }
  get state(): OperationState {
    return this.#state;
  }
  subscribe(listener: (state: OperationState) => void): () => void {
    this.#listeners.add(listener);
    listener(this.#state);
    return () => this.#listeners.delete(listener);
  }
  #set(patch: Partial<OperationState>): void {
    if (this.#closed) return;
    this.#state = { ...this.#state, ...patch };
    for (const listener of this.#listeners) listener(this.#state);
  }
  #run(action: () => Promise<void>): Promise<void> {
    if (this.#closed) return Promise.resolve();
    return this.#lifetime.run(async () => {
      const request = ++this.#request;
      this.#set({ busy: true });
      try {
        await action();
        if (!this.#closed && request === this.#request)
          this.feedback.recovered();
      } catch (error) {
        if (!this.#closed && request === this.#request) {
          this.#set({ phase: this.#state.snapshot ? "ready" : "unavailable" });
          this.feedback.report(error);
        }
      } finally {
        if (request === this.#request) this.#set({ busy: false });
      }
    });
  }
  refresh(preferred?: string): Promise<void> {
    return this.#run(async () => {
      const selection = this.#selection;
      const heads = await this.reader.heads();
      if (selection !== this.#selection || this.#closed) return;
      this.#set({
        heads: heads.heads,
        headsReady: true,
        phase: this.#state.snapshot ? "ready" : "idle",
      });
      if (preferred && !this.#state.operation) await this.#pin(preferred);
      else if (this.#state.operation && !this.#state.snapshot)
        await this.#pin(this.#state.operation);
      else if (this.#state.operation && !this.#state.ready)
        await this.#graph(false);
      else if (!this.#state.operation && heads.heads.length === 1)
        await this.#pin(heads.heads[0]);
    });
  }
  selectPin(operation: string): Promise<void> {
    return this.#run(() => this.#pin(operation));
  }
  async #pin(operation: string): Promise<void> {
    const selection = ++this.#selection;
    this.#detail++;
    this.files.reset();
    this.#abort.abort();
    const abort = (this.#abort = new AbortController());
    const prior = this.#handle;
    this.#handle = undefined;
    this.#set({
      ...initialOperationState(),
      heads: this.#state.heads,
      headsReady: this.#state.headsReady,
      operation,
      phase: "loading",
      busy: true,
    });
    if (prior) await this.#lifetime.closeHandle(prior);
    const handle = await this.reader.open(operation);
    this.#lifetime.handles.add(handle);
    if (this.#closed) return;
    if (selection !== this.#selection) {
      await this.#lifetime.closeHandle(handle);
      return;
    }
    this.#handle = handle;
    const snapshot = await prepared(
      this.reader,
      handle,
      abort.signal,
      this.wait,
    );
    check(snapshot.operation === operation);
    if (selection !== this.#selection || this.#closed) return;
    this.#set({ snapshot, phase: "ready" });
    await this.#graph(false);
  }
  more(): Promise<void> {
    return this.#run(() => this.#graph(true));
  }
  async #graph(append: boolean): Promise<void> {
    const handle = this.#handle,
      operation = this.#state.operation;
    if (!handle || !operation || (append && !this.#state.next)) return;
    const response = await this.reader.read(handle, {
      kind: "graph",
      query: [
        { graph: "operations" },
        { limit: 50, after: append ? this.#state.next : null },
      ],
    });
    if (handle !== this.#handle || this.#closed) return;
    check(
      response.kind === "graph" &&
        response.data.operation === operation &&
        response.data.data.graph === "operations",
    );
    const retained = append ? this.#state.nodes : [];
    const incoming = response.data.data.nodes;
    const ids = new Set(retained.map((node) => node.id));
    for (const node of incoming) {
      check(!ids.has(node.id));
      ids.add(node.id);
    }
    const nodes = [...retained, ...incoming].slice(0, 200);
    this.#set({
      nodes,
      ready: true,
      next: nodes.length < 200 ? response.data.next : null,
    });
  }
  clearSelection(): Promise<void> {
    return this.#run(async () => {
      this.#detail++;
      this.files.reset();
      this.#set({ selected: undefined, parent: undefined, detail: undefined });
    });
  }
  select(node: LocalGraphOperationNode): Promise<void> {
    return this.#run(async () => {
      const selected = this.#state.nodes.find((item) => item.id === node.id);
      check(selected);
      this.#detail++;
      this.files.reset();
      this.#set({ selected, parent: undefined, detail: undefined });
      if (selected.parents.length <= 1)
        await this.#compare(selected.parents[0]);
    });
  }
  selectParent(parent: string): Promise<void> {
    return this.#run(async () => {
      check(this.#state.selected?.parents.includes(parent));
      await this.#compare(parent);
    });
  }
  async #compare(parent?: string): Promise<void> {
    const handle = this.#handle,
      selected = this.#state.selected;
    if (!handle || !selected) return;
    const request = ++this.#detail;
    this.files.reset();
    this.#set({ parent, detail: undefined });
    const response = await this.reader.read(handle, {
      kind: "operation_diff",
      query: { operation: selected.id, parent },
    });
    if (this.#closed || handle !== this.#handle || request !== this.#detail)
      return;
    check(
      response.kind === "operation_diff" &&
        response.data.data.operation === selected.id,
    );
    const detail = response.data.data;
    if ("parent" in detail) check(detail.parent === parent);
    else if ("status" in detail && detail.status === "root")
      check(!selected.parents.length);
    this.#set({ detail });
    if (detail.status === "difference")
      await this.files.load(selected.id, detail.parent);
  }
  close(): Promise<void> {
    this.#closed = true;
    this.#selection++;
    this.#detail++;
    this.files.reset();
    this.#abort.abort();
    this.#listeners.clear();
    return (this.#closing ??= this.#lifetime.drain().catch((error) => {
      this.#closing = undefined;
      throw error;
    }));
  }
}
