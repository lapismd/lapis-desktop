import type { LocalGraphCommit } from "@lapismd/jj-history";

export type RepositoryWorkspace = { name: string; commit: LocalGraphCommit };

/** Only explicitly recorded native workspaces are offered. */
export function repositoryWorkspaces(
  commits: readonly LocalGraphCommit[],
): RepositoryWorkspace[] {
  return commits.flatMap((commit) =>
    commit.workspaces.map((name) => ({ name, commit })),
  );
}
