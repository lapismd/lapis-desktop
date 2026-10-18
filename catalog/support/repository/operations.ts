import type {
  LocalGraphOperationNode,
  LocalOperationDiffData,
  LocalCodeQuery,
  LocalCodeResponse,
} from "@lapismd/jj-history";
import {
  historyFixture,
  operation,
  otherOperation,
  revision,
  parent,
} from "./fixture.ts";
export function operationNode(
  id = operation,
  parents = [otherOperation],
): LocalGraphOperationNode {
  return {
    id,
    parents,
    view: "de".repeat(64),
    description: parents.length ? "describe commit" : "initialize repo",
    user: "Ada",
    host: "laptop",
    start: { millis: 1792252800000n, offset_minutes: 0 },
    end: { millis: 1792252800001n, offset_minutes: 0 },
    is_snapshot: false,
    attributes: {},
    predecessor_data_present: true,
  };
}
export function operationDifference(
  id: string,
  comparison?: string,
): LocalOperationDiffData {
  if (id === otherOperation)
    return { operation: id, view: "de".repeat(64), status: "root" };
  return {
    status: "difference",
    operation: id,
    parent: comparison!,
    before_view: "de".repeat(64),
    after_view: "ef".repeat(64),
    visible_commits: { added: [revision], removed: [parent] },
    view: {
      heads: { added: [revision], removed: [parent] },
      local_bookmarks: [{ name: "main", before: [parent], after: [revision] }],
      local_tags: [],
      remote_views: [],
      git_refs: [],
      git_heads: [],
      workspaces: [],
    },
  };
}
export function operationFixture(scenario = "operation-ready") {
  const f = historyFixture(
    scenario === "operation-admission-failure"
      ? "failure"
      : scenario === "operation-multiple-heads"
        ? "multiple"
        : scenario === "operation-paths-failure"
          ? "paths-failure"
          : scenario.startsWith("operation-")
            ? "ready"
            : scenario,
  );
  const read = f.reader.read;
  const originalOpen = f.reader.open;
  const pins = new Map<string, string>();
  f.reader.open = async (selected) => {
    const handle = await originalOpen(selected);
    pins.set(handle, selected);
    return handle;
  };
  let failed =
    scenario === "operation-detail-failure" ||
    scenario === "operation-files-failure" ||
    scenario === "operation-parent-failure" ||
    scenario === "operation-picker-failure";
  let graphFailed = scenario === "operation-graph-failure";
  const nodes =
    scenario === "operation-empty"
      ? []
      : [operationNode(), operationNode(otherOperation, [])];
  if (["operation-merge", "operation-picker-failure"].includes(scenario))
    nodes[0].parents.push("ad".repeat(64));
  if (scenario === "operation-snapshot") nodes[0].is_snapshot = true;
  if (["operation-parent-failure", "operation-parent-bound"].includes(scenario))
    nodes[0].parents = ["ad".repeat(64)];
  if (scenario === "operation-rich") {
    nodes[0].description =
      "describe commit 5ae7211b218e61eae163d39677075f5165c90ce8";
    nodes[0].attributes.args =
      "jj describe -r @ -m 'Keep repository history beside the notes'";
  }
  let parentPages = 0;
  f.reader.read = async (
    handle: string,
    query: LocalCodeQuery,
  ): Promise<LocalCodeResponse> => {
    if (query.kind === "graph" && query.query[0].graph === "operations") {
      f.calls.push([handle, query]);
      if (graphFailed)
        throw new Error("The operation history could not be read");
      const after = query.query[1].after;
      if (scenario === "operation-parent-bound" && after) {
        parentPages++;
        const id = String(parentPages).repeat(128);
        return {
          kind: "graph",
          data: {
            version: 1,
            operation: pins.get(handle)!,
            data: { graph: "operations", nodes: [operationNode(id)] },
            next: { kind: "operation", id },
            stats: stats(),
          },
        };
      }
      if (
        [
          "operation-parent-failure",
          "operation-merge",
          "operation-picker-failure",
        ].includes(scenario) &&
        after
      ) {
        if (failed) throw new Error("The parent operation could not be read");
        return {
          kind: "graph",
          data: {
            version: 1,
            operation: pins.get(handle)!,
            data: {
              graph: "operations",
              nodes: [
                {
                  ...operationNode("ad".repeat(64)),
                  description: "unloaded parent",
                  user: "Grace",
                  workspace: "review",
                },
              ],
            },
            next: null,
            stats: stats(),
          },
        };
      }
      return {
        kind: "graph",
        data: {
          version: 1,
          operation: pins.get(handle)!,
          data: {
            graph: "operations",
            nodes:
              pins.get(handle) === otherOperation
                ? nodes.filter((node) => node.id === otherOperation)
                : nodes,
          },
          stats: stats(),
        },
      };
    }
    if (query.kind === "operation_changes") {
      f.calls.push([handle, query]);
      if (scenario === "operation-files-failure" && failed)
        throw new Error("The operation revisions failed");
      const comparison =
        scenario === "operation-ambiguous"
          ? {
              status: "select" as const,
              before: [parent, "33".repeat(20)],
              after: [revision],
            }
          : scenario === "operation-unavailable"
            ? { status: "unavailable" as const }
            : { status: "exact" as const, from: parent, to: revision };
      return {
        kind: "operation_changes",
        data: {
          version: 1,
          operation: query.query.operation,
          parent: query.query.parent,
          groups: [
            {
              change: "aa".repeat(16),
              before: [parent],
              after: [revision],
              comparison,
            },
          ],
          stats: stats(),
        },
      };
    }
    if (query.kind === "operation_diff") {
      f.calls.push([handle, query]);
      if (failed && scenario === "operation-detail-failure")
        throw new Error("The operation comparison failed");
      return {
        kind: "operation_diff",
        data: {
          version: 1,
          data: operationDifference(
            query.query.operation,
            query.query.parent ?? undefined,
          ),
          stats: stats(),
        },
      };
    }
    return read(handle, query);
  };
  return {
    ...f,
    recover() {
      failed = false;
      graphFailed = false;
      f.recover();
    },
  };
}
function stats() {
  return {
    metadata_nodes: 0,
    predicate_file_bytes: 0,
    predicate_lines: 0,
    object_reads: 0,
    object_bytes: 0,
    work: 0,
  };
}
