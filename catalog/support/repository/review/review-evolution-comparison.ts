import type {
  LocalGraphEvolutionNode,
  LocalFileDiffChange,
} from "@lapismd/jj-history";

const contents = new Map([
  ["11".repeat(20), "# Notes\nHistory is retained\n"],
  ["33".repeat(20), "# Notes\nShortcuts resolve conflicts\n"],
  ["44".repeat(20), "# Notes\nHistory stays local\n"],
  ["66".repeat(20), "# Notes\nShortcuts stay local\n"],
  ["55".repeat(20), "# Notes\nDraft vault\n"],
  ["77".repeat(20), "# Notes\nDraft shortcuts\n"],
  ["22".repeat(20), "# Notes\nOld title\n"],
]);

/** Fixture-only comparisons, preserving native commit parents and predecessors. */
export function reviewEvolutionComparison(
  nodes: readonly LocalGraphEvolutionNode[],
  selected?: string,
): {
  label: string;
  message?: string;
  from?: string;
  change?: LocalFileDiffChange;
  paths?: LocalFileDiffChange[];
} {
  const node = nodes.find((node) => node.commit.id === selected);
  const previous = node?.predecessors ?? [];
  const label = previous.length ? "Previous version" : "Comparison parent";
  if (!node)
    return { label, message: "Select a version to inspect its changes." };
  if (!node.predecessors_known)
    return {
      label,
      message: "Predecessor records are unavailable for this version.",
    };
  if (previous.length > 1)
    return {
      label,
      message: "A comparison for this combined rewrite is unavailable.",
    };
  const from =
    previous[0] ??
    (node.commit.parents.length === 1 ? node.commit.parents[0] : undefined);
  const predecessor = nodes.find((node) => node.commit.id === from);
  if (
    previous.length &&
    (!predecessor ||
      JSON.stringify(predecessor.commit.parents) !==
        JSON.stringify(node.commit.parents))
  ) {
    return {
      label,
      message:
        "This rewrite has different parents. A rebase-aligned comparison is unavailable.",
    };
  }
  const before = from ? contents.get(from) : undefined;
  const after = contents.get(node.commit.id);
  if (!from || before === undefined || after === undefined)
    return {
      label,
      message: "No comparison is available for this version.",
    };
  const change: LocalFileDiffChange = {
    path: "Welcome.md",
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
          before,
          after,
        },
      ],
    },
  };
  const path: LocalFileDiffChange = {
    ...change,
    content: { status: "unavailable", reason: "not_requested" },
  };
  return { label, from, change, paths: [path], message: undefined };
}
