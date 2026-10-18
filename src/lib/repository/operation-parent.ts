import type { Handle, LocalGraphOperationNode } from "@lapismd/jj-history";
import type { HistoryReader } from "./history-reader.ts";
import { check } from "./history-selection.ts";

/** Resolve metadata through the desktop's qualified immutable graph profile. */
export async function operationParents(
  reader: HistoryReader,
  handle: Handle,
  pin: string,
  selected: string,
  parents: readonly string[],
  known: readonly LocalGraphOperationNode[],
  current: () => boolean,
): Promise<LocalGraphOperationNode[] | undefined> {
  const result = new Map(
    known
      .filter((node) => parents.includes(node.id))
      .map((node) => [node.id, node]),
  );
  if (new Set(parents.filter((id) => !result.has(id))).size > 64)
    throw new Error("Parent details exceed the preview limit");
  let after = selected;
  const seen = new Set([after]);
  for (
    let page = 0;
    page < 4 && parents.some((id) => !result.has(id));
    page++
  ) {
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
    for (const node of nodes)
      if (parents.includes(node.id)) result.set(node.id, node);
    if (parents.every((id) => result.has(id))) break;
    const next = response.data.next;
    if (!next) break;
    check(next.kind === "operation" && !seen.has(next.id));
    after = next.id;
    seen.add(after);
  }
  if (!current()) return;
  if (parents.some((id) => !result.has(id)))
    throw new Error("The parent operation is outside the bounded history page");
  return [...new Set(parents)].map((id) => result.get(id)!);
}

export async function operationParent(
  reader: HistoryReader,
  handle: Handle,
  pin: string,
  selected: string,
  parent: string,
  current: () => boolean,
): Promise<LocalGraphOperationNode | undefined> {
  return (
    await operationParents(reader, handle, pin, selected, [parent], [], current)
  )?.[0];
}
