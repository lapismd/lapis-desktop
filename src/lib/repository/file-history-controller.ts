import type {
  Handle,
  LocalCodeObjectKey,
  LocalGraphCommit,
} from "@lapismd/jj-history";
import type { HistoryReader } from "./history-reader.ts";
import { HistoryLifetime } from "./history-lifetime.ts";
import { check, prepared } from "./history-selection.ts";
import { workspaceCommits } from "./operation-metadata.ts";

export type FileHistoryState = {
  path?: string;
  phase: "idle" | "loading" | "ready" | "unavailable";
  busy: boolean;
  heads: string[];
  operation?: string;
  commits: LocalGraphCommit[];
  next?: LocalCodeObjectKey | null;
};
const initial = (): FileHistoryState => ({
  phase: "idle",
  busy: false,
  heads: [],
  commits: [],
});

/** Independent file scope; new editor selections fence every delayed response. */
export class FileHistoryController {
  #state = initial();
  #listeners = new Set<(state: FileHistoryState) => void>();
  #generation = 0;
  #abort = new AbortController();
  #handle?: Handle;
  #workspace?: string;
  #closed = false;
  #closing?: Promise<void>;
  readonly #lifetime: HistoryLifetime;
  readonly reader: HistoryReader;
  readonly feedback: { report(error: unknown): void; recovered(): void };
  constructor(
    reader: HistoryReader,
    feedback: FileHistoryController["feedback"],
  ) {
    this.reader = reader;
    this.feedback = feedback;
    this.#lifetime = new HistoryLifetime(reader);
  }
  get state() {
    return this.#state;
  }
  subscribe(listener: (state: FileHistoryState) => void) {
    this.#listeners.add(listener);
    listener(this.#state);
    return () => {
      this.#listeners.delete(listener);
    };
  }
  #set(patch: Partial<FileHistoryState>) {
    if (this.#closed) return;
    this.#state = { ...this.#state, ...patch };
    for (const listener of this.#listeners) listener(this.#state);
  }
  follow(path?: string): Promise<void> {
    if (path === this.#state.path) return Promise.resolve();
    return this.#load(path);
  }
  refresh(operation?: string): Promise<void> {
    return this.#load(this.#state.path, operation ?? this.#state.operation);
  }
  #load(path?: string, operation?: string): Promise<void> {
    if (this.#closed) return Promise.resolve();
    const generation = ++this.#generation;
    this.#abort.abort();
    const abort = (this.#abort = new AbortController());
    const prior = this.#handle;
    this.#handle = undefined;
    this.#workspace = undefined;
    this.#set({ ...initial(), path, operation });
    return this.#run(generation, async () => {
      if (prior) await this.#lifetime.closeHandle(prior);
      if (!path || !this.#valid(generation)) return;
      const heads = await this.reader.heads();
      if (!this.#valid(generation)) return;
      operation ??= heads.heads.length === 1 ? heads.heads[0] : undefined;
      this.#set({ heads: heads.heads, operation });
      if (!operation) return;
      const handle = await this.reader.open(operation);
      this.#lifetime.handles.add(handle);
      if (!this.#valid(generation)) {
        await this.#lifetime.closeHandle(handle);
        return;
      }
      this.#handle = handle;
      const snapshot = await prepared(this.reader, handle, abort.signal);
      check(snapshot.operation === operation);
      if (!this.#valid(generation)) return;
      const workspaces = await workspaceCommits(this.reader, handle, operation);
      if (!this.#valid(generation)) return;
      this.#workspace = workspaces.flatMap((commit) => commit.workspaces)[0];
      if (!this.#workspace)
        throw new Error(
          "File history requires an existing JJ workspace context.",
        );
      await this.#page(generation, false);
    });
  }
  more(): Promise<void> {
    if (this.#closed || this.#state.busy || !this.#state.next)
      return Promise.resolve();
    return this.#run(this.#generation, () =>
      this.#page(this.#generation, true),
    );
  }
  #valid(generation: number) {
    return !this.#closed && generation === this.#generation;
  }
  #run(generation: number, action: () => Promise<void>) {
    this.#set({ busy: true, phase: "loading" });
    return this.#lifetime.run(async () => {
      try {
        await action();
        if (this.#valid(generation)) {
          this.#set({ phase: "ready" });
          this.feedback.recovered();
        }
      } catch (error) {
        if (this.#valid(generation)) {
          this.#set({ phase: "unavailable" });
          this.feedback.report(error);
        }
      } finally {
        if (this.#valid(generation)) this.#set({ busy: false });
      }
    });
  }
  async #page(generation: number, append: boolean) {
    const { operation, path } = this.#state,
      handle = this.#handle;
    if (!handle || !operation || !path) return;
    const response = await this.reader.read(handle, {
      kind: "graph",
      query: [
        {
          graph: "log",
          revset: `all() & files(root-file:${JSON.stringify(path)})`,
          workspace: this.#workspace,
          user_email: "",
          at_time_millis: Date.now(),
        },
        { limit: 50, after: append ? this.#state.next : null },
      ],
    });
    if (!this.#valid(generation)) return;
    check(
      response.kind === "graph" &&
        response.data.operation === operation &&
        response.data.data.graph === "log",
    );
    const retained = append ? this.#state.commits : [];
    const incoming = response.data.data.nodes.map((node) => node.commit);
    check(
      !incoming.some((commit) =>
        retained.some((prior) => prior.id === commit.id),
      ),
    );
    const commits = [...retained, ...incoming].slice(0, 200);
    this.#set({
      commits,
      next: commits.length < 200 ? response.data.next : null,
    });
  }
  close(): Promise<void> {
    this.#closed = true;
    this.#generation++;
    this.#abort.abort();
    this.#listeners.clear();
    return (this.#closing ??= this.#lifetime.drain().catch((error) => {
      this.#closing = undefined;
      throw error;
    }));
  }
}
