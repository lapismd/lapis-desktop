import type { LocalGraphCommit } from "@lapismd/jj-history";
import type { TagListItem } from "@lapismd/design-core/shadcn/tag-list";
import { encodeJjChangeId } from "./graph/repository-log-graph.ts";

export function commitCardTags(commit?: LocalGraphCommit): TagListItem[] {
  if (!commit) return [];
  return [
    ...commit.bookmarks
      .filter((b) => b.added && !b.removed)
      .map((b) => ({
        id: `bookmark:${JSON.stringify([b.name, b.remote])}`,
        label: b.remote ? `${b.name}@${b.remote}` : b.name,
        variant: "secondary" as const,
      })),
    ...commit.workspaces.map((name) => ({
      id: `workspace:${name}`,
      label: name,
      tone: "success" as const,
    })),
    ...(commit.conflicted
      ? [{ id: "conflict", label: "Conflict", tone: "warning" as const }]
      : []),
    ...(commit.divergent
      ? [{ id: "divergent", label: "Divergent", tone: "warning" as const }]
      : []),
  ];
}
export function commitCardSearch(
  id: string,
  commit?: LocalGraphCommit,
): string {
  return [
    id,
    commit?.description,
    commit?.author.name,
    commit?.author.email,
    commit ? encodeJjChangeId(commit.change_id) : "",
    ...commitCardTags(commit).map((tag) => tag.label),
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();
}
