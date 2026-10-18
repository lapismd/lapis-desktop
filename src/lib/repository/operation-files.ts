import type {
  LocalCodeQuery,
  LocalCodeResponse,
  LocalFileDiffChange,
  LocalOperationChangesGroup,
} from "@lapismd/jj-history";
import { check } from "./history-selection.ts";
export interface OperationFilesState {
  ready: boolean;
  groups: LocalOperationChangesGroup[];
  next?: string | null;
  group?: LocalOperationChangesGroup;
  from?: string;
  to?: string;
  paths: LocalFileDiffChange[];
  pathsReady: boolean;
  nextPath?: string | null;
  path?: string;
  diff?: LocalFileDiffChange;
}
export const initialOperationFiles = (): OperationFilesState => ({
  ready: false,
  groups: [],
  paths: [],
  pathsReady: false,
});
/** Shares the operation reader's lifetime; every reset fences delayed replies. */
export class OperationFiles {
  state = initialOperationFiles();
  #epoch = 0;
  #file = 0;
  #operation?: string;
  #parent?: string;
  readonly read: (q: LocalCodeQuery) => Promise<LocalCodeResponse>;
  readonly run: (f: () => Promise<void>) => Promise<void>;
  readonly changed: (s: OperationFilesState) => void;
  constructor(
    read: OperationFiles["read"],
    run: OperationFiles["run"],
    changed: OperationFiles["changed"],
  ) {
    this.read = read;
    this.run = run;
    this.changed = changed;
  }
  #set(patch: Partial<OperationFilesState>) {
    this.state = { ...this.state, ...patch };
    this.changed(this.state);
  }
  reset() {
    this.#epoch++;
    this.#file++;
    this.#operation = undefined;
    this.#parent = undefined;
    this.state = initialOperationFiles();
    this.changed(this.state);
  }
  async load(operation: string, parent: string) {
    this.reset();
    this.#operation = operation;
    this.#parent = parent;
    await this.#groups(false);
  }
  more() {
    return this.run(() => this.#groups(true));
  }
  retry() {
    return this.run(() => this.#groups(false));
  }
  async #groups(append: boolean) {
    const operation = this.#operation,
      parent = this.#parent,
      epoch = this.#epoch;
    if (!operation || !parent || (append && !this.state.next)) return;
    const response = await this.read({
      kind: "operation_changes",
      query: {
        operation,
        parent,
        limit: 100,
        anchor: append ? this.state.next : null,
        direction: "forward",
      },
    });
    if (epoch !== this.#epoch) return;
    check(
      response.kind === "operation_changes" &&
        response.data.operation === operation &&
        response.data.parent === parent,
    );
    const retained = append ? this.state.groups : [];
    const ids = new Set(retained.map((g) => g.change));
    for (const group of response.data.groups) {
      check(!ids.has(group.change));
      ids.add(group.change);
    }
    const groups = [...retained, ...response.data.groups].slice(0, 500);
    this.#set({
      groups,
      ready: true,
      next: groups.length < 500 ? response.data.next : null,
    });
  }
  selectGroup(change: string) {
    return this.run(async () => {
      const group = this.state.groups.find((g) => g.change === change);
      check(group);
      this.#epoch++;
      this.#file++;
      this.#set({
        group,
        from: undefined,
        to: undefined,
        paths: [],
        pathsReady: false,
        nextPath: null,
        path: undefined,
        diff: undefined,
      });
      if (group.comparison.status === "exact")
        await this.#compare(group.comparison.from, group.comparison.to);
    });
  }
  compare(from: string, to: string) {
    return this.run(() => this.#compare(from, to));
  }
  async #compare(from: string, to: string) {
    const group = this.state.group;
    check(group);
    const comparison = group.comparison;
    check(
      comparison.status === "exact"
        ? comparison.from === from && comparison.to === to
        : comparison.status === "select" &&
            comparison.before.includes(from) &&
            comparison.after.includes(to),
    );
    this.#epoch++;
    this.#file++;
    this.#set({
      from,
      to,
      paths: [],
      pathsReady: false,
      nextPath: null,
      path: undefined,
      diff: undefined,
    });
    await this.#paths(false);
  }
  morePaths() {
    return this.run(() => this.#paths(true));
  }
  retryPaths() {
    return this.run(() => this.#paths(false));
  }
  async #paths(append: boolean) {
    const { from, to, nextPath } = this.state,
      epoch = this.#epoch;
    if (!from || !to || (append && !nextPath)) return;
    const response = await this.read({
      kind: "diff_paths",
      query: {
        from,
        to,
        path: "",
        limit: 100,
        anchor: append ? nextPath : null,
        direction: "forward",
      },
    });
    if (epoch !== this.#epoch) return;
    check(
      response.kind === "diff_paths" &&
        response.data.from === from &&
        response.data.to === to,
    );
    const paths = [
      ...(append ? this.state.paths : []),
      ...response.data.changes,
    ].slice(0, 500);
    this.#set({
      paths,
      pathsReady: true,
      nextPath: paths.length < 500 ? response.data.next : null,
    });
  }
  selectPath(path: string) {
    return this.run(async () => {
      const { from, to } = this.state,
        epoch = this.#epoch,
        request = ++this.#file;
      if (!from || !to) return;
      check(this.state.paths.some((p) => p.path === path));
      this.#set({ path, diff: undefined });
      const response = await this.read({
        kind: "diff",
        query: { from, to, path, content: true },
      });
      if (epoch !== this.#epoch || request !== this.#file) return;
      check(
        response.kind === "diff" &&
          response.data.from === from &&
          response.data.to === to &&
          response.data.path === path,
      );
      const diff = response.data.changes.find((c) => c.path === path);
      check(diff);
      this.#set({ diff });
    });
  }
}
