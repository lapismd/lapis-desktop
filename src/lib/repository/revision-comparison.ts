import type { Handle } from "@lapismd/jj-history";
import type { HistoryReader } from "./history-reader.ts";
import type { HistoryState } from "./history-state.ts";
import { check } from "./history-selection.ts";

type Scope = { handle?: Handle; state: HistoryState; closed: boolean };
/** File replies are fenced independently from graph paging and metadata. */
export class RevisionComparison {
  #comparison = 0;
  #file = 0;
  readonly reader: HistoryReader;
  readonly scope: () => Scope;
  readonly publish: (patch: Partial<HistoryState>) => void;
  constructor(
    reader: HistoryReader,
    scope: () => Scope,
    publish: (patch: Partial<HistoryState>) => void,
  ) {
    this.reader = reader;
    this.scope = scope;
    this.publish = publish;
  }
  reset() {
    this.#comparison++;
    this.#file++;
  }
  async paths(base: string, append: boolean): Promise<void> {
    const comparison = append ? this.#comparison : ++this.#comparison;
    const handle = this.scope().handle,
      revision = this.scope().state.revision;
    if (!handle || !revision) return;
    if (!append)
      this.publish({
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
        anchor: append ? this.scope().state.nextPath : null,
        direction: "forward",
      },
    });
    if (
      comparison !== this.#comparison ||
      handle !== this.scope().handle ||
      revision.id !== this.scope().state.revision?.id ||
      base !== this.scope().state.base ||
      this.scope().closed
    )
      return;
    check(
      response.kind === "diff_paths" &&
        response.data.from === base &&
        response.data.to === revision.id,
    );
    const paths = [
      ...(append ? this.scope().state.paths : []),
      ...response.data.changes,
    ].slice(0, 500);
    this.publish({
      paths,
      nextPath: paths.length < 500 ? response.data.next : null,
      pathsReady: true,
    });
  }
  async selectPath(path: string): Promise<void> {
    const comparison = this.#comparison,
      file = ++this.#file;
    const handle = this.scope().handle,
      revision = this.scope().state.revision,
      base = this.scope().state.base;
    if (!handle || !revision || !base) return;
    check(this.scope().state.paths.some((change) => change.path === path));
    this.publish({ path, diff: undefined });
    const response = await this.reader.read(handle, {
      kind: "diff",
      query: { from: base, to: revision.id, path, content: true },
    });
    if (
      comparison !== this.#comparison ||
      file !== this.#file ||
      handle !== this.scope().handle ||
      revision.id !== this.scope().state.revision?.id ||
      base !== this.scope().state.base ||
      path !== this.scope().state.path ||
      this.scope().closed
    )
      return;
    check(
      response.kind === "diff" &&
        response.data.from === base &&
        response.data.to === revision.id &&
        response.data.path === path,
    );
    const change = response.data.changes.find((change) => change.path === path);
    check(change);
    this.publish({ diff: change });
  }
}
