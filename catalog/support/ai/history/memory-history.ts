import type {
  AiHistoryBinding,
  AiTurnRecord,
} from "../../../../src/lib/repository/ai-history.ts";
import type { LocalFileDiffChange } from "@lapismd/jj-history";

export function memoryHistory(failure = false) {
  const records = new Map<string, AiTurnRecord>();
  let undone = 0;
  const checkpoint = (commit: string) => ({
    operation: "a".repeat(128),
    commit: commit.repeat(40),
    change_id: "c".repeat(32),
    description: "Saved fixture checkpoint",
    timestamp_millis: Date.now(),
  });
  const stats = {
    metadata_nodes: 0,
    predicate_file_bytes: 0,
    predicate_lines: 0,
    object_reads: 0,
    object_bytes: 0,
    work: 0,
  };
  const files: LocalFileDiffChange[] = [
    [
      "Notes/alpha.md",
      "# Notes\n\nTODO: summarize this note.\n",
      "# Notes\n\nA clear, concise summary of the project.\n",
    ],
    [
      "Projects/Planning/roadmap.md",
      "# Roadmap\n",
      "# Roadmap\n\n- Review the notes\n- Share the summary\n",
    ],
    [
      "Projects/Planning/decisions.md",
      "",
      "# Decisions\n\nKeep the heading hierarchy consistent.\n",
    ],
  ].map(([path, before, after]) => ({
    path: path!,
    before: [],
    after: [],
    sources: [],
    content: {
      status: "text",
      hunks: [
        {
          kind: "different",
          before_start: 0,
          after_start: 0,
          before: before!,
          after: after!,
        },
      ],
    },
  }));
  const binding: AiHistoryBinding = {
    enabled: () => true,
    guard: (action) => action(),
    reveal: async () => {},
    service: {
      async begin(context) {
        if (failure)
          throw new Error(
            "Fixture disk is unavailable. The prompt has not been sent.",
          );
        const record: AiTurnRecord = {
          version: 1,
          context,
          started_at: Date.now(),
          ended_at: null,
          phase: "running",
          before: checkpoint("1"),
          after: null,
          outcome: null,
        };
        records.set(context.turn, record);
        return record;
      },
      async bind(context) {
        const record = { ...records.get(context.turn)!, context };
        records.set(context.turn, record);
        return record;
      },
      async end(_conversation, turn, outcome) {
        const record: AiTurnRecord = {
          ...records.get(turn)!,
          phase: outcome === "unknown" ? "incomplete" : "complete",
          ended_at: Date.now(),
          after: outcome === "unknown" ? null : checkpoint("2"),
          outcome,
        };
        records.set(turn, record);
        return record;
      },
      read: async (_conversation, turn) => records.get(turn)!,
      list: async (conversation) => ({
        records: [...records.values()].filter(
          (r) => r.context.conversation === conversation,
        ),
        next: null,
      }),
      previewUndo: async (_conversation, _turn, paths) => ({
        paths: paths.length ? paths : files.map((f) => f.path),
        expected: "e".repeat(64),
      }),
      undo: async () => {
        undone++;
      },
      pendingUndo: async () => [],
    },
    reader: {
      heads: async () => ({
        version: 1,
        repository: "fixture",
        profile: "local",
        generation: 1,
        heads: ["a".repeat(128)],
      }),
      open: async () => "history-fixture",
      close: async () => {},
      status: async () => {
        throw new Error("The fixture handle is already ready");
      },
      async read(_handle, query) {
        if (query.kind === "diff_paths")
          return {
            kind: "diff_paths",
            data: {
              version: 1,
              from: query.query.from,
              to: query.query.to,
              path: "",
              changes: files,
              stats,
              next: null,
            },
          };
        if (query.kind === "diff")
          return {
            kind: "diff",
            data: {
              version: 1,
              from: query.query.from,
              to: query.query.to,
              path: query.query.path,
              changes: files.filter((f) => f.path === query.query.path),
              stats,
            },
          };
        throw new Error("Unsupported fixture history query");
      },
    },
  };
  return { binding, inspect: () => String(undone) };
}
