import { readFileSync } from "node:fs";

const inventory = JSON.parse(
  readFileSync(new URL("./native-quarantines.json", import.meta.url), "utf8"),
);
export const nativeQuarantines = inventory.cases.map((entry) => ({
  platform: inventory.platform,
  nextReview: inventory.nextReview,
  ...entry,
}));
const byId = new Map(nativeQuarantines.map((entry) => [entry.id, entry]));
export const quarantineVariable = "LAPIS_DESKTOP_QUARANTINE_CASES";

export function selectQuarantines(ids) {
  if (!Array.isArray(ids) || ids.length === 0)
    throw Error("Select at least one quarantine case ID.");
  if (new Set(ids).size !== ids.length)
    throw Error("Duplicate quarantine case IDs are not permitted.");
  return ids.map((id) => {
    if (!byId.has(id)) throw Error(`Unknown quarantine case ID: ${id}`);
    return byId.get(id);
  });
}

export function diagnosticSelection(environment = process.env) {
  if (environment[quarantineVariable] === undefined) return [];
  let ids;
  try {
    ids = JSON.parse(environment[quarantineVariable]);
  } catch {
    throw Error(`${quarantineVariable} must be a JSON array of case IDs.`);
  }
  return selectQuarantines(ids);
}

/** Only an explicit diagnostic selector removes the original skip. */
export function quarantine(id, active = true, environment = process.env) {
  const entry = byId.get(id);
  if (!entry) throw Error(`Unknown quarantine case ID: ${id}`);
  if (!active) return { skip: false };
  const selected = diagnosticSelection(environment);
  return {
    skip: selected.some((candidate) => candidate.id === id)
      ? false
      : entry.reason,
  };
}

export function quarantineNamePattern(selected) {
  return `^(?:${selected
    .map(({ title }) => title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|")})$`;
}

/** Skips, missing results and duplicate execution cannot establish recovery. */
export function quarantineResults(selected, events) {
  const outcomes = new Map(selected.map((entry) => [entry.title, []]));
  for (const event of events) {
    if (!["test:pass", "test:fail"].includes(event.type)) continue;
    outcomes.get(event.data.name)?.push(event);
  }
  const cases = nativeQuarantines.map((entry) => {
    if (!outcomes.has(entry.title))
      return { id: entry.id, status: "not-selected" };
    const results = outcomes.get(entry.title);
    let status = "not-executed";
    if (results.length > 1) status = "duplicate-execution";
    else if (results.length === 1) {
      const result = results[0];
      status = result.data.skip
        ? "skipped"
        : result.type === "test:fail"
          ? "failed"
          : "passed";
    }
    return { id: entry.id, status };
  });
  const executed = cases.filter((entry) =>
    ["passed", "failed"].includes(entry.status),
  ).length;
  return {
    schema: 1,
    kind: "quarantine-diagnostic",
    qualification: false,
    selected: selected.map((entry) => entry.id),
    executed,
    passed: cases.filter((entry) => entry.status === "passed").length,
    failed: cases.filter((entry) => entry.status === "failed").length,
    cases,
    ok:
      executed === selected.length &&
      cases.every((entry) => ["passed", "not-selected"].includes(entry.status)),
  };
}
