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

export const revisionFileRowSelector =
  'button[data-ui-part="file-row"][data-file-path]';

export function revisionComparisonPaths(attributes) {
  if (
    !Array.isArray(attributes) ||
    attributes.some((path) => typeof path !== "string" || path.length === 0) ||
    new Set(attributes).size !== attributes.length
  )
    throw new Error("Invalid revision file-row identities");
  return attributes;
}

export async function revisionComparisonRowPaths(rows) {
  if (!rows || typeof rows.map !== "function")
    throw new Error("Invalid revision file-row collection");
  const attributes = await rows.map((row) =>
    row.getAttribute("data-file-path"),
  );
  return revisionComparisonPaths(await Promise.all(attributes));
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

export function revisionComparisonDiagnostic({
  expected,
  selected,
  expanded,
  busy,
  files,
  empty,
  unavailable,
  paths = [],
}) {
  return {
    expected,
    selected: selected ?? null,
    expanded: Boolean(expanded),
    busy: Boolean(busy),
    state: revisionComparisonState({ files, empty, unavailable }),
    paths: paths.slice(0, 16).map((path) => String(path).slice(0, 160)),
  };
}
