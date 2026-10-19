import contents from "../../../../src/lib/repository/blame-controller.ts?raw";
import type { BlameCommit } from "../../../../src/lib/repository/blame-model.ts";
import type { HistoryReader } from "../../../../src/lib/repository/history-reader.ts";
import { revision, parent } from "../fixture.ts";

export const largeBlamePath = "src/lib/repository/blame-controller.ts";
export const largeBlameContents = contents;
export const longLinesBlameContents = [
  `// ${"Keep source text and recorded attribution readable together, even when a note contains a long paragraph. ".repeat(12)}`,
  `export const capturedPath = "${"workspace-history/".repeat(30)}retained-conversation-with-an-unusually-long-file-name.md";`,
  contents,
].join("\n");
const subjects = [
  "Keep repository history beside the notes",
  "Pin source and attribution to the same operation",
  "Fence stale replies when the active file changes",
  "Drain retained reads before releasing a vault",
  "Keep source readable while blame origins are preparing",
  "Bound annotation continuations and reject repeated cursors",
  "Preserve exact native identifiers across the renderer boundary when switching repositories and restoring an earlier workspace session",
  "Show recoverable failures through workspace notifications",
  "Clear the previous file anchor before starting admission",
  "Attribute merge revisions without guessing parent pairs",
  "Retain plain source if syntax highlighting is unavailable",
  "Expose long-running history work in application status",
];
const authors = [
  "Ada Chen",
  "Grace Martin",
  "Sam Rivera",
  "Maya Patel",
  "Alex Morgan",
  "Jordan Lee",
];
export const largeBlameCommits: BlameCommit[] = subjects.map(
  (subject, index) => {
    const name = authors[index % authors.length]!;
    const signature = {
      name,
      email:
        index % 4 === 0
          ? "dev@lapis.md"
          : `${name.toLowerCase().replaceAll(" ", ".")}@example.test`,
      timestamp: {
        millis: Date.now() - (index * 29 + 2) * 3_600_000,
        offset_minutes: 0,
      },
    };
    return {
      id:
        index === 0
          ? revision
          : index === 1
            ? parent
            : (index + 16).toString(16).repeat(20),
      change_id: (index + 32).toString(16).repeat(16),
      description: `${subject}\n\nKeep each read attached to its recorded operation and preserve the user's current selection.\n\n- Retain immutable source membership.\n- Cancel obsolete work before publishing the next result.\n- Keep progress visible without blocking the editor.`,
      author: signature,
      committer: signature,
    };
  },
);
export const largeCommitStats = Object.fromEntries(
  largeBlameCommits.map((commit, index) => [
    commit.id,
    {
      additions: index === 0 ? 22 : 8 + index * 7,
      deletions: index === 0 ? 15 : index % 4 === 0 ? 0 : 3 + index * 2,
    },
  ]),
);

/** Real source text with synthetic, deterministic review attribution; no git reads. */
export function attachLargeBlame(
  reader: HistoryReader,
  contents = largeBlameContents,
) {
  const read = reader.read,
    blame = reader.blame!;
  reader.read = async (handle, query) => {
    const response = await read(handle, query);
    return query.kind === "file_at"
      ? {
          kind: "file_at",
          data: {
            bytes: new TextEncoder().encode(contents).length,
            text: contents,
            binary: false,
            too_large: false,
          },
        }
      : response;
  };
  const lineCount = contents.trimEnd().split("\n").length;
  const ranges: Array<{ start: number; end: number; commit_id: string }> = [];
  const lengths = [4, 1, 13, 7, 2, 24, 5, 9, 1, 18, 6, 3];
  for (let start = 1, index = 0; start <= lineCount; index++) {
    const end = Math.min(
      lineCount + 1,
      start + lengths[index % lengths.length]!,
    );
    ranges.push({
      start,
      end,
      commit_id: largeBlameCommits[index % largeBlameCommits.length]!.id,
    });
    start = end;
  }
  reader.blame = async (handle, query) => ({
    ...(await blame(handle, query)),
    line_count: lineCount,
    ranges,
    commits: Object.fromEntries(
      largeBlameCommits.map((commit) => [commit.id, commit]),
    ),
    complete: true,
    continuation: null,
    history_commits: largeBlameCommits.length,
  });
}
