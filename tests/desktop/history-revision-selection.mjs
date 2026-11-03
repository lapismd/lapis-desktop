export async function oldestRevisionContaining(revisions, path, changedPaths) {
  const inspected = [];
  for (const revision of [...revisions].reverse()) {
    const paths = await changedPaths(revision);
    inspected.push({ revision, paths });
    if (paths.includes(path)) return revision;
  }
  const detail = inspected
    .map(
      ({ revision, paths }) => `${revision}: ${paths.join(", ") || "<none>"}`,
    )
    .join("; ");
  throw new Error(`No inspected revision changed ${path}; ${detail}`);
}

export function revisionComparisonState({ files, empty, unavailable }) {
  const visible = [
    files && "files",
    empty && "empty",
    unavailable && "unavailable",
  ].filter(Boolean);
  if (visible.length > 1)
    throw new Error(
      `Conflicting revision comparison states: ${visible.join(", ")}`,
    );
  return visible[0] ?? "pending";
}
