import type { Handle } from "@lapismd/jj-history";
import type { HistoryReader } from "./history-reader.ts";
import type { HistoryState } from "./history-state.ts";
import { check } from "./history-selection.ts";

type Scope = { handle?: Handle; state: HistoryState; closed: boolean };
/** Bounded commit paging; the controller retains its reader/lifetime authority. */
export class HistoryGraph {
  readonly reader: HistoryReader;
  readonly scope: () => Scope;
  readonly publish: (state: Partial<HistoryState>) => void;
  constructor(
    reader: HistoryReader,
    scope: () => Scope,
    publish: HistoryGraph["publish"],
  ) {
    this.reader = reader;
    this.scope = scope;
    this.publish = publish;
  }
  async load(append: boolean): Promise<void> {
    const { handle, state, closed } = this.scope();
    const operation = state.operation;
    if (closed || !handle || !operation || (append && !state.next)) return;
    const response = await this.reader.read(handle, {
      kind: "graph",
      query: [
        {
          graph: "log",
          revset: "all()",
          user_email: "",
          at_time_millis: Date.now(),
        },
        { limit: 50, after: append ? state.next : null },
      ],
    });
    const current = this.scope();
    if (current.handle !== handle || current.closed) return;
    check(
      response.kind === "graph" &&
        response.data.operation === operation &&
        response.data.data.graph === "log",
    );
    const commits = response.data.data.nodes.map((node) => node.commit);
    const retained = append ? current.state.commits : [];
    check(
      !commits.some((commit) => retained.some((item) => item.id === commit.id)),
    );
    const combined = [...retained, ...commits].slice(0, 200);
    this.publish({
      commits: combined,
      commitsReady: true,
      next: combined.length < 200 ? response.data.next : null,
    });
  }
}
