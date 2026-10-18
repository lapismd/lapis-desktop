import type { Handle, LocalGraphOperationNode } from "@lapismd/jj-history";
import type { HistoryReader } from "./history-reader.ts";
import { check } from "./history-selection.ts";

/** Resolve metadata through the desktop's qualified immutable graph profile. */
export async function operationParent(
  reader: HistoryReader,
  handle: Handle,
  pin: string,
  selected: string,
  parent: string,
  current: () => boolean,
): Promise<LocalGraphOperationNode | undefined> {
  let after = selected;
  const seen = new Set([after]);
  for (let page = 0; page < 4; page++) {
    const response = await reader.read(handle, {
      kind: "graph",
      query: [
        { graph: "operations" },
        { limit: 50, after: { kind: "operation", id: after } },
      ],
    });
    if (!current()) return;
    check(
      response.kind === "graph" &&
        response.data.operation === pin &&
        response.data.data.graph === "operations",
    );
    const { nodes } = response.data.data;
    check(nodes.length <= 50);
    const node = nodes.find((node) => node.id === parent);
    if (node) return node;
    const next = response.data.next;
    if (!next) break;
    check(next.kind === "operation" && !seen.has(next.id));
    after = next.id;
    seen.add(after);
  }
  throw new Error("The parent operation is outside the bounded history page");
}
