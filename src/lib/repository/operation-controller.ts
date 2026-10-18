import { OperationGraph } from "./operation-graph.ts";
import {
  operationRevisionCards,
  workspaceCommits,
} from "./operation-metadata.ts";
import { operationParent, operationParents } from "./operation-parent.ts";
import { OperationFiles } from "./operation-files.ts";
import type { Handle, LocalGraphOperationNode } from "@lapismd/jj-history";
import type { HistoryReader } from "./history-reader.ts";
import { HistoryLifetime } from "./history-lifetime.ts";
import { check, pause, prepared } from "./history-selection.ts";
import {
  initialOperationState,
  resetOperationSelection,
  type OperationState,
} from "./operation-state.ts";

/** Independent operation-pinned reader; it shares no mutable history selection. */
export class OperationController {
  #state = initialOperationState();
  readonly files: OperationFiles;
  readonly #graph: OperationGraph;
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
    this.#graph = new OperationGraph(
      reader,
      () => ({
        handle: this.#handle,
        state: this.#state,
        closed: this.#closed,
      }),
      (patch) => this.#set(patch),
    );
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
        await this.#graph.load(false);
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
    await this.#graph.load(false);
  }
  more(): Promise<void> {
    return this.#run(() => this.#graph.load(true));
  }
  loadRevisions(): Promise<void> {
    return this.#run(async () => {
      const handle = this.#handle,
        detail = this.#detail;
      if (!handle) return;
      const commits = await operationRevisionCards(
        this.reader,
        handle,
        this.#state,
        () =>
          !this.#closed && this.#handle === handle && this.#detail === detail,
      );
      if (commits) this.#set({ commits });
    });
  }
  loadWorkspaces(): Promise<void> {
    return this.#run(async () => {
      const handle = this.#handle,
        operation = this.#state.operation;
      if (!handle || !operation) return;
      const commits = await workspaceCommits(this.reader, handle, operation);
      if (!this.#closed && handle === this.#handle)
        this.#set({ workspaceCommits: commits });
    });
  }
  selectWorkspace(workspace: string | null): Promise<void> {
    return this.#run(async () => {
      this.#detail++;
      this.files.reset();
      this.#set({ workspace, ...resetOperationSelection() });
    });
  }
  clearSelection(): Promise<void> {
    return this.#run(async () => {
      this.#detail++;
      this.files.reset();
      this.#set(resetOperationSelection());
    });
  }
  select(node: LocalGraphOperationNode): Promise<void> {
    return this.#run(async () => {
      const selected =
        this.#state.selected?.id === node.id
          ? this.#state.selected
          : this.#state.nodes.find((item) => item.id === node.id);
      check(selected);
      await this.#selectNode(selected);
    });
  }
  selectId(id: string): Promise<void> {
    return this.#run(async () => {
      const known = this.#state.nodes.find((node) => node.id === id);
      if (known) return this.#selectNode(known);
      const handle = this.#handle;
      check(handle && this.#state.selected?.parents.includes(id));
      const request = ++this.#detail;
      const node = await operationParent(
        this.reader,
        handle,
        this.#state.operation!,
        this.#state.selected!.id,
        id,
        () =>
          !this.#closed && handle === this.#handle && request === this.#detail,
      );
      if (node) await this.#selectNode(node);
    });
  }
  async #selectNode(selected: LocalGraphOperationNode): Promise<void> {
    this.#detail++;
    this.files.reset();
    this.#set({
      selected,
      parent: undefined,
      detail: undefined,
      parentNodes: [],
    });
    if (selected.parents.length <= 1) await this.#compare(selected.parents[0]);
  }
  loadParents(): Promise<void> {
    return this.#run(async () => {
      const handle = this.#handle,
        selected = this.#state.selected,
        request = this.#detail;
      if (!handle || !selected) return;
      const parentNodes = await operationParents(
        this.reader,
        handle,
        this.#state.operation!,
        selected.id,
        selected.parents,
        [...this.#state.nodes, ...this.#state.parentNodes],
        () =>
          !this.#closed && handle === this.#handle && request === this.#detail,
      );
      if (parentNodes) this.#set({ parentNodes });
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
