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
