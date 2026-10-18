import type {
  LocalGraphCommit,
  LocalGraphOperationNode,
} from "@lapismd/jj-history";
/** Presentation-only adaptation of jj-store's commit/operation graph model. */
export type RepositoryLogRevision = {
  eventId: string;
  changeId: string;
  parents: string[];
  message: string;
  reason: "checkpoint" | "merge";
  author: string;
  host?: string;
  millis: number | bigint;
  tags: string[];
  conflicted?: boolean;
};
export type RepositoryLogDevice = { alias: string; revisionEventId: string };
export function commitRows(
  commits: LocalGraphCommit[],
): RepositoryLogRevision[] {
  return commits.map((commit) => ({
    eventId: commit.id,
    changeId: commit.change_id,
    parents: commit.parents,
    message: commit.description.split("\n")[0] || "No description",
    reason: commit.parents.length > 1 ? "merge" : "checkpoint",
    author: commit.author.name,
    millis: commit.author.timestamp.millis,
    conflicted: commit.conflicted,
    tags: [
      ...(commit.divergent ? ["Divergent"] : []),
      ...commit.bookmarks.map(
        (bookmark) =>
          `${bookmark.name}${bookmark.remote ? `@${bookmark.remote}` : ""}${bookmark.conflicted ? " (conflicted)" : ""}`,
      ),
      ...commit.workspaces.map((workspace) =>
        workspace === "default"
          ? "Working copy"
          : `Working copy · ${workspace}`,
      ),
    ],
  }));
}
export function operationRows(
  nodes: LocalGraphOperationNode[],
): RepositoryLogRevision[] {
  return nodes.map((node) => ({
    eventId: node.id,
    changeId: "",
    parents: node.parents,
    message: node.description || "No description",
    reason: node.parents.length > 1 ? "merge" : "checkpoint",
    author: node.user,
    host: node.host,
    millis: node.end.millis,
    tags: [
      ...(node.is_snapshot ? ["Snapshot"] : []),
      ...(node.workspace ? [node.workspace] : []),
    ],
  }));
}
