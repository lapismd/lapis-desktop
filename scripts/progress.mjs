import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { repositoryFiles } from "./repository-files.mjs";
import {
  parseTasks,
  parseEvidence,
  validateProgress,
  inventoryErrors,
  migrationSummary,
  taskPath,
  markdownProjection,
} from "./progress-model.mjs";

function vcs(root, args) {
  return execFileSync("jj", ["--no-pager", "--ignore-working-copy", ...args], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}
export function changedPaths(
  root,
  base = process.env.LAPIS_DESKTOP_BASE ?? "@-",
  head = process.env.LAPIS_DESKTOP_HEAD ?? "@",
) {
  if (!existsSync(resolve(root, ".jj")))
    throw new Error(
      "Progress validation requires this repository's Jujutsu metadata.",
    );
  return vcs(root, ["diff", "--name-only", "--from", base, "--to", head])
    .trim()
    .split("\n")
    .filter(Boolean);
}
export function evidenceFileErrors(evidence, current, base, historicalFiles) {
  const errors = [];
  for (const entry of evidence) {
    let recorded;
    for (const file of entry.files ?? []) {
      if (current.has(file) || base.has(file)) continue;
      if (base.has(entry.path)) recorded ??= historicalFiles(entry.path);
      if (!recorded?.has(file))
        errors.push(`${entry.id}: evidence names missing file ${file}.`);
    }
  }
  return errors;
}
export function progressFindings(
  root,
  { checkSummary = true, checkRevision = true } = {},
) {
  const files = repositoryFiles(root);
  const read = (file) => readFileSync(resolve(root, file), "utf8");
  const tasks = parseTasks(read(taskPath));
  const evidenceFiles = files.filter((file) =>
    /^spec\/src\/history\/E-.+\.md$/u.test(file),
  );
  const evidence = evidenceFiles.map((file) => ({
    ...parseEvidence(read(file)),
    path: file,
  }));
  const requirements = new Set(
    files
      .filter((file) =>
        /^spec\/src\/current\/(?:governance|desktop|migration)\.md$/u.test(
          file,
        ),
      )
      .flatMap((file) =>
        [...read(file).matchAll(/^\|\s*(LD-[A-Z]+-\d{3})\s*\|/gmu)].map(
          (match) => match[1],
        ),
      ),
  );
  const errors = [
    ...validateProgress(tasks, evidence, requirements),
    ...inventoryErrors(
      JSON.parse(read("spec/migration-inventory.json")),
      tasks,
    ),
  ];
  const base = process.env.LAPIS_DESKTOP_BASE ?? "@-";
  const previousFiles = new Set(
    vcs(root, ["file", "list", "-r", base]).trim().split("\n"),
  );
  errors.push(
    ...evidenceFileErrors(evidence, new Set(files), previousFiles, (path) => {
      const revision = vcs(root, [
        "log",
        "--no-graph",
        "-r",
        `latest(::(${base}) & files(${JSON.stringify(path)}))`,
        "-T",
        "commit_id",
      ]).trim();
      if (!revision) return new Set();
      const parents = vcs(root, [
        "log",
        "--no-graph",
        "-r",
        `parents(${revision})`,
        "-T",
        'commit_id ++ "\\n"',
      ])
        .trim()
        .split("\n")
        .filter(Boolean);
      return new Set(
        [revision, ...parents].flatMap((snapshot) =>
          vcs(root, ["file", "list", "-r", snapshot]).trim().split("\n"),
        ),
      );
    }),
  );
  const summary = migrationSummary(tasks);
  if (
    checkSummary &&
    markdownProjection(read("MIGRATION.md")) !== markdownProjection(summary)
  )
    errors.push("MIGRATION.md is stale; run pnpm progress:generate.");
  if (checkRevision) {
    const changed = changedPaths(root);
    for (const file of evidenceFiles)
      if (
        previousFiles.has(file) &&
        read(file) !== vcs(root, ["file", "show", "-r", base, file])
      )
        errors.push(
          `${file}: committed evidence is immutable; append a new record.`,
        );
    const protectedChanges = changed.filter(
      (file) => !/^spec\/src\/history\//u.test(file),
    );
    const fresh = evidence.filter(
      (entry) => !previousFiles.has(entry.path) && changed.includes(entry.path),
    );
    if (protectedChanges.length && !fresh.length)
      errors.push("Protected changes require fresh evidence.");
    for (const file of protectedChanges)
      if (!fresh.some((entry) => entry.files?.includes(file)))
        errors.push(`${file}: no fresh evidence coverage.`);
  }
  return { tasks, evidence, summary, errors };
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    if (process.argv.includes("--write")) {
      const tasks = parseTasks(readFileSync(taskPath, "utf8"));
      writeFileSync("MIGRATION.md", migrationSummary(tasks));
      console.log("Generated MIGRATION.md.");
    } else {
      const result = progressFindings(process.cwd());
      for (const error of result.errors) console.error(error);
      if (result.errors.length) process.exitCode = 1;
      else
        console.log(
          `Progress passes (${result.tasks.length} tasks; ${result.evidence.length} evidence records; bookkeeping only).`,
        );
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
