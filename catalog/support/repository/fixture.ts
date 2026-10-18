import { richCommitMessage } from "./rich-commit.ts";
import { commitDetail } from "./commit-detail.ts";
import type { HistoryReader } from "../../../src/lib/repository/history-reader.ts";
import type {
  LocalGraphCommit,
  LocalCodeQuery,
  LocalCodeResponse,
} from "@lapismd/jj-history";
export const operation = "ab".repeat(64);
export const otherOperation = "cd".repeat(64);
export const repository = "ef".repeat(16);
export const revision = "11".repeat(20);
export const parent = "22".repeat(20);
export function commit(id = revision): LocalGraphCommit {
  const signature = {
    name: "Ada",
    email: "ada@example.test",
    timestamp: { millis: 1792252800000, offset_minutes: 0 },
  };
  return {
    id,
    change_id: "aa".repeat(16),
    parents: id === revision ? [parent] : [],
    description:
      id === revision
        ? "Keep repository history beside the notes"
        : "Start the vault",
    author: signature,
    committer: signature,
    tree_terms: [],
    conflicted: false,
    bookmarks: [],
    workspaces: [],
    visible: true,
    divergent: false,
  };
}
export function historyFixture(scenario = "ready") {
  const calls: Array<[string, unknown]> = [];
  const closed: string[] = [];
  let heads =
    scenario === "empty"
      ? []
      : scenario === "multiple"
        ? [operation, otherOperation]
        : [operation];
  let failed = scenario === "failure";
  const faults = new Set<string>();
  if (scenario === "read-failure") faults.add("diff");
  if (scenario === "graph-failure") faults.add("graph");
  if (scenario === "paths-failure") faults.add("diff_paths");
  let sequence = 0;
  const handles = new Map<string, string>();
  const latest = commit();
  if (scenario === "merge" || scenario === "parent-details-failure")
    latest.parents.push("33".repeat(20));
  if (scenario === "parent-details-failure") faults.add("commit");
  if (scenario === "conflicted") latest.conflicted = true;
  latest.workspaces = ["default"];
  if (scenario === "rich-history") {
    latest.description = richCommitMessage;
    latest.bookmarks = [null, "origin"].map((remote) => ({
      name: "main",
      remote,
      added: true,
      removed: false,
      conflicted: false,
    }));
  }
  const change = {
    path: "Welcome.md",
    before: [],
    after: [],
    sources: [],
    content: {
      status: "unavailable" as const,
      reason: "not_requested" as const,
    },
  };
  const reader: HistoryReader = {
    async heads() {
      calls.push(["heads", null]);
      if (failed) {
        failed = false;
        throw new Error("The repository could not be read");
      }
      return {
        version: 1,
        profile: "local",
        repository,
        generation: 18446744073709551615n,
        heads,
      };
    },
    async open(selected) {
      calls.push(["open", selected]);
      const id = `handle-${++sequence}`;
      handles.set(id, selected);
      return id;
    },
    async status(handle) {
      calls.push(["status", handle]);
      if (scenario === "preparing") return { state: "preparing" };
      return {
        state: "ready",
        data: {
          version: 1,
          profile: "local",
          repository,
          generation: 18446744073709551615n,
          operation: handles.get(handle)!,
        },
      };
    },
    async read(
      handle: string,
      query: LocalCodeQuery,
    ): Promise<LocalCodeResponse> {
      calls.push([handle, query]);
      if (faults.has(query.kind))
        throw new Error(
          query.kind === "graph"
            ? "The revision history could not be read"
            : query.kind === "diff_paths"
              ? "The revision comparison failed"
              : query.kind === "commit"
                ? "The parent details could not be read"
                : "The file comparison failed",
        );
      if (query.kind === "conflicts")
        return {
          kind: "conflicts",
          data: {
            version: 1,
            commit: query.query.commit,
            change: latest.change_id,
            conflicts: [
              {
                path: "Welcome.md",
                fingerprint: "ad".repeat(32),
                terms: [],
                editor: {
                  status: "text",
                  executable: false,
                  contents: [
                    "# Notes\nYour version\n",
                    "# Notes\nBase version\n",
                    "# Notes\nOther version\n",
                  ],
                },
              },
            ],
            stats: stats(),
          },
        };
      if (query.kind === "commit") {
        const value = commit(query.query.commit);
        if (query.query.commit === "33".repeat(20)) {
          value.description = "Second recorded parent";
          value.author = {
            ...value.author,
            name: "Grace",
            email: "grace@example.test",
          };
          value.bookmarks = [
            {
              name: "topic",
              remote: null,
              added: true,
              removed: false,
              conflicted: false,
            },
          ];
        }
        return commitDetail(value);
      }
      if (query.kind === "graph")
        return {
          kind: "graph",
          data: {
            version: 1,
            operation: handles.get(handle)!,
            data: {
              graph: "log",
              nodes: (scenario === "no-revisions"
                ? []
                : [latest, commit(parent)]
              ).map((item) => ({
                commit: item,
                edges: [],
              })),
            },
            stats: stats(),
          },
        };
      if (query.kind === "diff_paths")
        return {
          kind: "diff_paths",
          data: {
            version: 1,
            ...query.query,
            changes: scenario === "unchanged" ? [] : [change],
            stats: stats(),
          },
        };
      if (query.kind === "diff")
        return {
          kind: "diff",
          data: {
            version: 1,
            ...query.query,
            changes: [
              {
                ...change,
                content:
                  scenario === "binary"
                    ? { status: "unavailable", reason: "binary" }
                    : {
                        status: "text",
                        hunks: [
                          {
                            kind: "different",
                            before_start: 0,
                            after_start: 0,
                            before: "# Notes\nOld title\n",
                            after: "# Notes\nHistory is retained\n",
                          },
                        ],
                      },
              },
            ],
            stats: stats(),
          },
        };
      throw new Error("Unsupported fixture query");
    },
    async close(handle) {
      calls.push(["close", handle]);
      closed.push(handle);
      handles.delete(handle);
    },
  };
  return {
    reader,
    calls,
    closed,
    latest,
    advance() {
      heads = [otherOperation];
    },
    fail() {
      failed = true;
    },
    recover() {
      faults.clear();
    },
    async close() {
      for (const handle of [...handles.keys()]) await reader.close(handle);
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
