import { createHash } from "node:crypto";

export const taskPath = "spec/src/current/progress/milestones.md";
export const taskPaths = [
  taskPath,
  "spec/src/current/progress/vault-backup.md",
];
export const statuses = new Set([
  "Planned",
  "In progress",
  "Partial",
  "Blocked",
  "Done",
  "Deferred",
]);
export function parseTasks(source) {
  return source
    .split("\n")
    .filter((line) => /^\|\s*M\d/u.test(line))
    .map((line) => {
      const cells = line
        .trim()
        .slice(1, -1)
        .split("|")
        .map((cell) => cell.trim());
      if (cells.length !== 7)
        throw new Error("Task rows require seven columns.");
      const [id, status, dependencies, requirements, gate, next, evidence] =
        cells;
      const list = (value) =>
        value === "-" ? [] : value.split(",").map((part) => part.trim());
      return {
        id,
        status,
        depends: list(dependencies),
        requirements: list(requirements),
        gate,
        next,
        evidence: list(evidence),
      };
    });
}
export function parseEvidence(source) {
  const blocks = [
    ...source.matchAll(/\x60\x60\x60json\s*\n([\s\S]*?)\n\x60\x60\x60/gu),
  ];
  if (blocks.length !== 1)
    throw new Error("Evidence needs exactly one JSON metadata block.");
  return JSON.parse(blocks[0][1]);
}
export function validateProgress(tasks, evidence, requirements) {
  const errors = [];
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const records = new Map(evidence.map((entry) => [entry.id, entry]));
  if (byId.size !== tasks.length) errors.push("Duplicate task ID.");
  if (records.size !== evidence.length) errors.push("Duplicate evidence ID.");
  for (const task of tasks) {
    if (
      !/^M\d+(?:\.\d+)?$/u.test(task.id) ||
      !statuses.has(task.status) ||
      !task.gate ||
      !task.next
    )
      errors.push(`${task.id}: invalid task fields.`);
    if (
      !task.requirements.length ||
      task.requirements.some((id) => !requirements.has(id))
    )
      errors.push(`${task.id}: unknown or missing requirement.`);
    for (const dependency of task.depends)
      if (!byId.has(dependency))
        errors.push(`${task.id}: unknown dependency ${dependency}.`);
    for (const id of task.evidence)
      if (!records.get(id)?.tasks.includes(task.id))
        errors.push(`${task.id}: missing selected evidence ${id}.`);
    if (
      ["In progress", "Partial", "Blocked", "Done"].includes(task.status) &&
      !task.evidence.length
    )
      errors.push(`${task.id}: status requires evidence.`);
    if (task.status === "Done") {
      if (task.depends.some((id) => byId.get(id)?.status !== "Done"))
        errors.push(`${task.id}: incomplete dependency.`);
      if (
        !task.evidence.some((id) => {
          const entry = records.get(id);
          return (
            entry?.result === "pass" &&
            entry.completedGates?.[task.id] === task.gate &&
            entry.runs.some((run) => run.result === "pass") &&
            !entry.remaining.length
          );
        })
      )
        errors.push(`${task.id}: original gate lacks passing evidence.`);
    }
  }
  const visiting = new Set(),
    visited = new Set();
  function visit(id) {
    if (visiting.has(id)) {
      errors.push(`${id}: dependency cycle.`);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const parent of byId.get(id)?.depends ?? []) visit(parent);
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of byId.keys()) visit(id);
  for (const record of evidence) {
    if (
      !/^E-[A-Z]+-\d{3}$/u.test(record.id) ||
      !["pass", "pending", "blocked", "fail"].includes(record.result)
    )
      errors.push("Invalid evidence identity or result.");
    for (const field of ["tasks", "requirements", "files", "runs", "remaining"])
      if (!Array.isArray(record[field]))
        errors.push(`${record.id}: missing ${field}.`);
    if (
      !record.revision ||
      !record.versions ||
      !record.milestoneReview ||
      !record.contractReview
    )
      errors.push(`${record.id}: missing revision, versions or reviews.`);
    for (const task of record.tasks ?? [])
      if (!byId.has(task)) errors.push(`${record.id}: unknown task.`);
    for (const id of record.requirements ?? [])
      if (!requirements.has(id))
        errors.push(`${record.id}: unknown requirement.`);
    for (const run of record.runs ?? [])
      if (
        !run.command ||
        !run.name ||
        !["pass", "fail", "pending"].includes(run.result) ||
        !Number.isInteger(run.failures) ||
        run.failures < 0 ||
        (run.result === "pass" && run.failures !== 0)
      )
        errors.push(`${record.id}: invalid run result.`);
    if (
      record.result === "pass" &&
      (record.remaining?.length ||
        !record.runs?.some((run) => run.result === "pass"))
    )
      errors.push(
        `${record.id}: pass requires a successful run and no remaining gate gaps.`,
      );
  }
  return errors;
}
export function migrationTimestamp(source) {
  const match = source.match(
    /^Last updated \*\*(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} UTC)\*\*\.$/mu,
  );
  if (!match) throw new Error("Task ledger needs an explicit UTC update time.");
  return match[1];
}
export function migrationSummary(tasks, updated = "") {
  const done =
    tasks
      .filter((task) => task.status === "Done")
      .map((task) => task.id)
      .join(", ") || "None";
  const open =
    tasks
      .filter((task) => !["Done", "Deferred"].includes(task.status))
      .map((task) => task.id)
      .join(", ") || "None";
  const backup = tasks.some((task) => task.id === "M14")
    ? " · [Backup implementation and acceptance](spec/src/current/progress/vault-backup.md)"
    : "";
  return `# Lapis Desktop migration\n\n<!-- Generated by pnpm progress:generate. Edit the task ledger. -->\n\n${updated ? `Last updated **${updated}**.\n\n` : ""}[Full plan](PLAN.md) · [Current checkpoint](PLAN.md#current-delivery-checkpoint) · [Task ledger](spec/src/current/progress/milestones.md)${backup} · [Inventory](spec/migration-inventory.json) · [Evidence](spec/src/history/index.md)\n\nCompleted: ${done}.\n\nOpen completion gates: ${open}.\n\nGate status describes milestone acceptance, not active or background work. Partial can retain implemented functionality whose native or provider acceptance is deferred. Implementation, focused checks and remaining qualification are recorded separately in the owning delivery ledger. Next actions follow the task dependencies; table order does not schedule work.\n\nThe Deno desktop is superseded and frozen. Signing and publication remain deferred to their distribution gates.\n\n| Task | Gate status | Next action |\n| --- | --- | --- |\n${tasks.map((task) => `| ${task.id} | ${task.status} | ${task.next} |`).join("\n")}\n`;
}
export function inventoryErrors(inventory, tasks) {
  const errors = [],
    ids = new Set(),
    taskIds = new Set(tasks.map((task) => task.id));
  for (const item of inventory.items ?? []) {
    if (!item.id || ids.has(item.id))
      errors.push("Duplicate or missing inventory ID.");
    ids.add(item.id);
    if (
      !taskIds.has(item.task) ||
      !["reuse", "port", "replace", "defer", "retire"].includes(
        item.disposition,
      )
    )
      errors.push(`${item.id}: invalid inventory destination.`);
    if (
      !inventory.sources?.[item.source]?.revision ||
      !item.path ||
      !item.label
    )
      errors.push(`${item.id}: missing source provenance.`);
  }
  for (const [kind, count] of Object.entries(inventory.coverage ?? {}))
    if (inventory.items.filter((item) => item.kind === kind).length !== count)
      errors.push(
        `${kind}: inventory coverage changed without an updated capture.`,
      );
  if (!inventory.items?.length) errors.push("Inventory is empty.");
  return errors;
}
export const digest = (value) =>
  createHash("sha256").update(value).digest("hex");
export function markdownProjection(source) {
  return source
    .split("\n")
    .filter((line) => !/^\|[\s:|\-]+\|$/u.test(line))
    .join("\n")
    .replace(/\s+/gu, "");
}
