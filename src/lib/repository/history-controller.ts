import type { Handle, LocalGraphCommit } from "@lapismd/jj-history";
import type { HistoryReader } from "./history-reader.ts";
import { initialHistoryState, type HistoryState } from "./history-state.ts";
import { check, pause, prepared } from "./history-selection.ts";
import { HistoryLifetime } from "./history-lifetime.ts";

export class HistoryController {
  #state = initialHistoryState();
  #listeners = new Set<(state: HistoryState) => void>();
  readonly #lifetime: HistoryLifetime;
  readonly reader: HistoryReader;
  readonly feedback: { report(error: unknown): void; recovered(): void };
  readonly wait: typeof pause;
  #handle?: Handle;
  #selection = 0;
  #request = 0;
  #abort = new AbortController();
  #closed = false;
  #closing?: Promise<void>;
  constructor(
    reader: HistoryReader,
    feedback: {
      report(error: unknown): void;
      recovered(): void;
    },
    wait = pause,
  ) {
    this.reader = reader;
    this.feedback = feedback;
    this.wait = wait;
    this.#lifetime = new HistoryLifetime(reader);
  }
  get state(): HistoryState {
    return this.#state;
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
          await this.#commits(false);
        else if (!this.#state.operation && heads.heads.length === 1)
          await this.#selectOperation(heads.heads[0]);
      }),
    );
  }
  selectOperation(operation: string): Promise<void> {
    return this.#run(() =>
      this.#action(() => this.#selectOperation(operation)),
    );
  }
  async #selectOperation(operation: string): Promise<void> {
    const selection = ++this.#selection;
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
    await this.#commits(false);
  }
  moreCommits(): Promise<void> {
    return this.#run(() => this.#action(() => this.#commits(true)));
  }
  async #commits(append: boolean): Promise<void> {
    const handle = this.#handle,
      operation = this.#state.operation;
    if (!handle || !operation || (append && !this.#state.next)) return;
    const response = await this.reader.read(handle, {
      kind: "graph",
      query: [
        {
          graph: "log",
          revset: "all()",
          user_email: "",
          at_time_millis: Date.now(),
        },
        { limit: 50, after: append ? this.#state.next : null },
      ],
    });
    if (this.#handle !== handle || this.#closed) return;
    check(
      response.kind === "graph" &&
        response.data.operation === operation &&
        response.data.data.graph === "log",
    );
    const commits = response.data.data.nodes.map((node) => node.commit);
    const retained = append ? this.#state.commits : [];
    check(
      !commits.some((commit) => retained.some((item) => item.id === commit.id)),
    );
    const combined = [...retained, ...commits].slice(0, 200);
    this.#set({
      commits: combined,
      commitsReady: true,
      next: combined.length < 200 ? response.data.next : null,
    });
  }
  selectRevision(revision: LocalGraphCommit): Promise<void> {
    return this.#run(() =>
      this.#action(async () => {
        check(this.#state.commits.some((item) => item.id === revision.id));
        this.#set({
          revision,
          base: undefined,
          paths: [],
          pathsReady: false,
          nextPath: null,
          path: undefined,
          diff: undefined,
        });
        if (revision.parents.length === 1)
          await this.#paths(revision.parents[0], false);
      }),
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
    const handle = this.#handle,
      revision = this.#state.revision;
    if (!handle || !revision) return;
    if (!append)
      this.#set({
        base,
        paths: [],
        pathsReady: false,
        nextPath: null,
        path: undefined,
        diff: undefined,
      });
    const response = await this.reader.read(handle, {
      kind: "diff_paths",
      query: {
        from: base,
        to: revision.id,
        path: "",
        limit: 100,
        anchor: append ? this.#state.nextPath : null,
        direction: "forward",
      },
    });
    if (
      handle !== this.#handle ||
      revision.id !== this.#state.revision?.id ||
      base !== this.#state.base ||
      this.#closed
    )
      return;
    check(
      response.kind === "diff_paths" &&
        response.data.from === base &&
        response.data.to === revision.id,
    );
    const paths = [
      ...(append ? this.#state.paths : []),
      ...response.data.changes,
    ].slice(0, 500);
    this.#set({
      paths,
      nextPath: paths.length < 500 ? response.data.next : null,
      pathsReady: true,
    });
  }
  selectPath(path: string): Promise<void> {
    return this.#run(() =>
      this.#action(async () => {
        const handle = this.#handle,
          revision = this.#state.revision,
          base = this.#state.base;
        if (!handle || !revision || !base) return;
        check(this.#state.paths.some((change) => change.path === path));
        this.#set({ path, diff: undefined });
        const response = await this.reader.read(handle, {
          kind: "diff",
          query: { from: base, to: revision.id, path, content: true },
        });
        if (
          handle !== this.#handle ||
          revision.id !== this.#state.revision?.id ||
          base !== this.#state.base ||
          path !== this.#state.path ||
          this.#closed
        )
          return;
        check(
          response.kind === "diff" &&
            response.data.from === base &&
            response.data.to === revision.id &&
            response.data.path === path,
        );
        const change = response.data.changes.find(
          (change) => change.path === path,
        );
        check(change);
        this.#set({ diff: change });
      }),
    );
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
