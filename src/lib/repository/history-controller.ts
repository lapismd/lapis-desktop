import { RevisionComparison } from "./revision-comparison.ts";
import { HistoryGraph } from "./history-graph.ts";
import { parentCandidates } from "./parent-candidates.ts";
import type { Handle, LocalGraphCommit } from "@lapismd/jj-history";
import type { HistoryReader } from "./history-reader.ts";
import {
  initialHistoryState,
  resetHistoryComparison,
  type HistoryState,
} from "./history-state.ts";
import { check, pause, prepared } from "./history-selection.ts";
import { HistoryLifetime } from "./history-lifetime.ts";

export class HistoryController {
  #state = initialHistoryState();
  #listeners = new Set<(state: HistoryState) => void>();
  readonly #lifetime: HistoryLifetime;
  readonly #graph: HistoryGraph;
  readonly #files: RevisionComparison;
  readonly reader: HistoryReader;
  readonly feedback: { report(error: unknown): void; recovered(): void };
  readonly wait: typeof pause;
  #handle?: Handle;
  #selection = 0;
  #comparison = 0;
  #request = 0;
  #abort = new AbortController();
  #closed = false;
  #pinned = false;
  #closing?: Promise<void>;
  constructor(
    reader: HistoryReader,
    feedback: HistoryController["feedback"],
    wait = pause,
  ) {
    this.reader = reader;
    this.feedback = feedback;
    this.wait = wait;
    this.#lifetime = new HistoryLifetime(reader);
    this.#files = new RevisionComparison(
      reader,
      () => ({
        handle: this.#handle,
        state: this.#state,
        closed: this.#closed,
      }),
      (patch) => this.#set(patch),
    );
    this.#graph = new HistoryGraph(
      reader,
      () => ({
        handle: this.#handle,
        state: this.#state,
        closed: this.#closed,
      }),
      (patch) => this.#set(patch),
    );
  }
  get state(): HistoryState {
    return this.#state;
  }
  get pinned() {
    return this.#pinned || !!this.#state.revision;
  }
  subscribe(listener: (state: HistoryState) => void): () => void {
    this.#listeners.add(listener);
    listener(this.#state);
    return () => this.#listeners.delete(listener);
  }
  #set(patch: Partial<HistoryState>): void {
    if (this.#closed) return;
    this.#state = { ...this.#state, ...patch };
    for (const listener of this.#listeners) listener(this.#state);
  }
  #run(action: () => Promise<void>): Promise<void> {
    if (this.#closed) return Promise.resolve();
    return this.#lifetime.run(action);
  }
  async #action(action: () => Promise<void>): Promise<void> {
    const request = ++this.#request;
    this.#set({ busy: true });
    try {
      await action();
      if (!this.#closed && request === this.#request) this.feedback.recovered();
    } catch (error) {
      if (!this.#closed && request === this.#request) {
        this.#set({ phase: this.#state.snapshot ? "ready" : "unavailable" });
        this.feedback.report(error);
      }
    } finally {
      if (request === this.#request) this.#set({ busy: false });
    }
  }
  refresh(preferred?: string): Promise<void> {
    if (preferred) this.#pinned = true;
    return this.#run(() =>
      this.#action(async () => {
        const selection = this.#selection;
        const heads = await this.reader.heads();
        if (selection !== this.#selection || this.#closed) return;
        this.#set({
          heads: heads.heads,
          headsReady: true,
          phase: this.#state.snapshot ? "ready" : "idle",
        });
        if (preferred && !this.#state.operation)
          await this.#selectOperation(preferred);
        else if (this.#state.operation && !this.#state.snapshot)
          await this.#selectOperation(this.#state.operation);
        else if (this.#state.operation && !this.#state.commitsReady)
          await this.#graph.load(false);
        else if (!this.#state.operation && heads.heads.length === 1)
          await this.#selectOperation(heads.heads[0]);
      }),
    );
  }
  selectOperation(operation: string): Promise<void> {
    this.#pinned = true;
    return this.#run(() =>
      this.#action(() => this.#selectOperation(operation)),
    );
  }
  checkpointChanged(operation: string): Promise<void> {
    if (
      this.#closed ||
      this.#pinned ||
      this.#state.revision ||
      this.#state.operation === operation
    )
      return Promise.resolve();
    return this.#run(() =>
      this.#action(() => this.#selectOperation(operation)),
    );
  }
  async #selectOperation(operation: string): Promise<void> {
    const selection = ++this.#selection;
    this.#comparison++;
    this.#files.reset();
    this.#abort.abort();
    const abort = (this.#abort = new AbortController());
    const prior = this.#handle;
    this.#handle = undefined;
    this.#set({
      ...initialHistoryState(),
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
  selectWorkspace(workspace: string | null): Promise<void> {
    this.#comparison++;
    this.#files.reset();
    return this.#run(() =>
      this.#action(async () => {
        this.#set({ ...resetHistoryComparison(), workspace });
        await this.#graph.load(false);
      }),
    );
  }
  moreCommits(): Promise<void> {
    return this.#run(() => this.#action(() => this.#graph.load(true)));
  }
  clearRevision(): Promise<void> {
    this.#comparison++;
    this.#files.reset();
    this.#request++;
    return this.#run(async () =>
      this.#set({ ...resetHistoryComparison(), busy: false }),
    );
  }
  selectRevision(revision: LocalGraphCommit): Promise<void> {
    this.#comparison++;
    this.#files.reset();
    return this.#run(() =>
      this.#action(async () => {
        check(this.#state.commits.some((item) => item.id === revision.id));
        this.#set({ ...resetHistoryComparison(), revision });
        if (revision.parents.length === 1)
          await this.#paths(revision.parents[0], false);
      }),
    );
  }
  openRevision(id: string): Promise<void> {
    const comparison = ++this.#comparison;
    this.#files.reset();
    return this.#run(() =>
      this.#action(async () => {
        const revision = await this.#graph.exact(
          id,
          () => comparison === this.#comparison,
        );
        if (!revision) return;
        this.#set({ ...resetHistoryComparison(), revision });
        if (revision.parents.length === 1)
          await this.#paths(revision.parents[0], false);
      }),
    );
  }
  loadParents(): Promise<void> {
    return this.#run(() =>
      this.#action(async () => {
        const handle = this.#handle,
          revision = this.#state.revision,
          generation = this.#comparison;
        if (!handle || !revision) return;
        const parentCommits = await parentCandidates(
          this.reader,
          handle,
          revision.parents,
          [...this.#state.commits, ...this.#state.parentCommits],
          () =>
            !this.#closed &&
            handle === this.#handle &&
            generation === this.#comparison,
        );
        if (parentCommits) this.#set({ parentCommits });
      }),
    );
  }
  loadConflicts(): Promise<void> {
    const comparison = this.#comparison;
    return this.#run(() =>
      this.#action(() =>
        this.#graph.conflicts(() => comparison === this.#comparison),
      ),
    );
  }
  selectBase(base: string): Promise<void> {
    return this.#run(() =>
      this.#action(async () => {
        check(this.#state.revision?.parents.includes(base));
        await this.#paths(base, false);
      }),
    );
  }
  morePaths(): Promise<void> {
    return this.#run(() =>
      this.#action(async () => {
        if (this.#state.base && this.#state.nextPath)
          await this.#paths(this.#state.base, true);
      }),
    );
  }
  async #paths(base: string, append: boolean): Promise<void> {
    if (!append) this.#comparison++;
    await this.#files.paths(base, append);
  }
  selectPath(path: string): Promise<void> {
    return this.#run(() => this.#action(() => this.#files.selectPath(path)));
  }
  close(): Promise<void> {
    this.#closed = true;
    this.#selection++;
    this.#abort.abort();
    this.#listeners.clear();
    return (this.#closing ??= (async () => {
      await this.#lifetime.drain();
    })().catch((error) => {
      this.#closing = undefined;
      throw error;
    }));
  }
}
