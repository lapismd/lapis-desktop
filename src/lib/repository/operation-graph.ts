import type { Handle } from "@lapismd/jj-history";
import type { HistoryReader } from "./history-reader.ts";
import type { OperationState } from "./operation-state.ts";
import { check } from "./history-selection.ts";
type Scope = { handle?: Handle; state: OperationState; closed: boolean };
export class OperationGraph {
  readonly reader: HistoryReader;
  readonly scope: () => Scope;
  readonly publish: (patch: Partial<OperationState>) => void;
  constructor(
    reader: HistoryReader,
    scope: () => Scope,
    publish: (patch: Partial<OperationState>) => void,
  ) {
    this.reader = reader;
    this.scope = scope;
    this.publish = publish;
  }
  async load(append: boolean): Promise<void> {
    const handle = this.scope().handle,
      operation = this.scope().state.operation;
    if (!handle || !operation || (append && !this.scope().state.next)) return;
    const response = await this.reader.read(handle, {
      kind: "graph",
      query: [
        { graph: "operations" },
        { limit: 50, after: append ? this.scope().state.next : null },
      ],
    });
    if (handle !== this.scope().handle || this.scope().closed) return;
    check(
      response.kind === "graph" &&
        response.data.operation === operation &&
        response.data.data.graph === "operations",
    );
    const retained = append ? this.scope().state.nodes : [];
    const incoming = response.data.data.nodes;
    const ids = new Set(retained.map((node) => node.id));
    for (const node of incoming) {
      check(!ids.has(node.id));
      ids.add(node.id);
    }
    const nodes = [...retained, ...incoming].slice(0, 200);
    this.publish({
      nodes,
      ready: true,
      next: nodes.length < 200 ? response.data.next : null,
    });
  }
}
