import type { LocalGraphCommit } from "@lapismd/jj-history";
import type { TagListItem } from "@lapismd/design-core/shadcn/tag-list";
import TriangleAlertIcon from "@lucide/svelte/icons/triangle-alert";
import type { RepositoryLogRevision } from "./graph/model.ts";
import { commitCardSearch } from "./commit-cards.ts";

/** Source-style display mapping; native metadata remains the authority. */
export function repositoryCommitTags(commit?: LocalGraphCommit): TagListItem[] {
  if (!commit) return [];
  return [
    ...(commit.parents.length > 1
      ? [{ id: "merge", label: "Merge", variant: "secondary" as const }]
      : []),
    ...(commit.divergent
      ? [{ id: "divergent", label: "Divergent", tone: "warning" as const }]
      : []),
    ...(commit.conflicted
      ? [
          {
            id: "conflicted",
            label: "Conflicted",
            tone: "danger" as const,
            icon: TriangleAlertIcon,
          },
        ]
      : []),
    ...commit.bookmarks
      .filter((bookmark) => bookmark.added && !bookmark.removed)
      .map((bookmark) => ({
        id: `bookmark:${JSON.stringify([bookmark.name, bookmark.remote])}`,
        label: `${bookmark.name}${bookmark.remote ? `@${bookmark.remote}` : ""}`,
        // Neutral bookmarks need an opaque chip on selected graph rows.
        variant: "secondary" as const,
        tone: bookmark.conflicted
          ? ("danger" as const)
          : bookmark.remote
            ? ("neutral" as const)
            : ("accent" as const),
      })),
    ...commit.workspaces.map((workspace) => ({
      id: `workspace:${workspace}`,
      label:
        workspace === "default"
          ? "Working copy"
          : `Working copy · ${workspace}`,
      tone: "success" as const,
    })),
  ];
}

export function repositoryGraphTags(
  revision: RepositoryLogRevision,
  commit?: LocalGraphCommit,
): TagListItem[] {
  if (commit) return repositoryCommitTags(commit);
  return [
    ...(revision.reason === "merge" ? [{ id: "merge", label: "Merge" }] : []),
    ...(revision.conflicted
      ? [
          {
            id: "conflicted",
            label: "Conflicted",
            tone: "danger" as const,
            icon: TriangleAlertIcon,
          },
        ]
      : []),
    ...revision.tags.map((label, index) => ({
      id: `operation:${index}:${label}`,
      label,
    })),
  ];
}

export function repositoryCommitSearch(
  id: string,
  commit?: LocalGraphCommit,
): string {
  return `${commitCardSearch(id, commit)} ${repositoryCommitTags(commit)
    .map((tag) => tag.label)
    .join(" ")}`.toLocaleLowerCase();
}
