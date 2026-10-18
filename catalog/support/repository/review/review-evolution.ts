import type {
  LocalGraphCommit,
  LocalGraphEvolutionNode,
} from "@lapismd/jj-history";
import { operation, otherOperation } from "../fixture.ts";

/** Explicit synthetic predecessor records; commit parents remain unchanged. */
export function reviewEvolutionFixture(
  commits: readonly LocalGraphCommit[],
): LocalGraphEvolutionNode[] {
  return commits.flatMap((current, index) => {
    const ids =
      index === 0
        ? ["44".repeat(20), "55".repeat(20)]
        : index === 1
          ? ["66".repeat(20), "77".repeat(20)]
          : [];
    const versions = [
      current,
      ...ids.map((id, version) => ({
        ...current,
        id,
        description:
          version === 0
            ? "Refine the vault history workflow\n\nKeep **history local** and review the `Welcome.md` changes before the final rewrite.\n\n- Preserve the operation pin.\n- Keep version comparisons separate from commit ancestry."
            : "Draft the vault history workflow\n\nCreate the first **vault history** draft and record its context.",
        bookmarks: [],
        workspaces: [],
        conflicted: false,
        visible: false,
        author: {
          ...current.author,
          timestamp: {
            ...current.author.timestamp,
            millis:
              Number(current.author.timestamp.millis) -
              (version + 1) * 3_600_000,
          },
        },
      })),
    ];
    return versions.map((commit, position) => ({
      commit,
      operation: position ? otherOperation : operation,
      predecessors: versions[position + 1] ? [versions[position + 1].id] : [],
      predecessors_known: true,
      legacy_predecessors: [],
    }));
  });
}

export function reviewEvolutionHistory(
  nodes: readonly LocalGraphEvolutionNode[],
  anchor?: string,
) {
  const reachable = new Set<string>();
  const pending = anchor ? [anchor] : [];
  while (pending.length && reachable.size < 100) {
    const id = pending.shift()!;
    if (reachable.has(id)) continue;
    reachable.add(id);
    const node = nodes.find((node) => node.commit.id === id);
    if (node?.predecessors_known) pending.push(...node.predecessors);
  }
  return nodes.filter((node) => reachable.has(node.commit.id));
}
