import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { repositoryFiles } from "./repository-files.mjs";
import { canonicalContractPath } from "./spec-contracts.mjs";
import { legacyEvidencePaths } from "./legacy-evidence.mjs";
import {
  parseEvidence,
  validateEvidence,
  revisionErrors,
  evidenceFileErrors,
} from "./evidence-model.mjs";

function vcs(root, args) {
  return execFileSync("jj", ["--no-pager", "--ignore-working-copy", ...args], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function latestFileChange(root, anchor, path) {
  return vcs(root, [
    "log",
    "--no-graph",
    "--limit",
    "1",
    "-r",
    `::(${anchor}) & files(${JSON.stringify(path)})`,
    "-T",
    "commit_id",
  ]).trim();
}

function snapshotFiles(root, revision, file) {
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
      vcs(root, ["file", "list", "-r", snapshot, ...(file ? ["--", file] : [])])
        .trim()
        .split("\n")
        .filter(Boolean),
    ),
  );
}

function historicalFiles(root, base, path) {
  const enclosing = latestFileChange(root, base, path);
  if (!enclosing) return new Set();
  const recorded = snapshotFiles(root, enclosing);
  return {
    has(file) {
      if (recorded.has(file)) return true;
      const earlier = latestFileChange(root, enclosing, file);
      if (!earlier || !snapshotFiles(root, earlier, file).has(file))
        return false;
      recorded.add(file);
      return true;
    },
  };
}

export function evidenceFindings(
  root,
  { checkRevision = true, base = process.env.LAPIS_DESKTOP_BASE ?? "@-" } = {},
) {
  if (!existsSync(resolve(root, ".jj")))
    throw new Error("Evidence validation requires Jujutsu metadata.");
  const files = repositoryFiles(root);
  const read = (file) => readFileSync(resolve(root, file), "utf8");
  const evidenceFiles = files.filter((file) =>
    /^spec\/src\/history\/E-.+\.md$/u.test(file),
  );
  const evidence = evidenceFiles.map((file) => ({
    ...parseEvidence(read(file)),
    path: file,
  }));
  const requirements = new Set(
    files
      .filter((file) => canonicalContractPath.test(file))
      .flatMap((file) =>
        [...read(file).matchAll(/^\|\s*(LD-[A-Z]+-\d{3})\s*\|/gmu)].map(
          (match) => match[1],
        ),
      ),
  );
  const head = process.env.LAPIS_DESKTOP_HEAD ?? "@";
  const previousFiles = new Set(
    vcs(root, ["file", "list", "-r", base]).trim().split("\n"),
  );
  const legacy = legacyEvidencePaths(
    JSON.parse(read("spec/evidence/legacy-validation-receipts.json")),
    read,
    (revision, path) => vcs(root, ["file", "show", "-r", revision, path]),
  );
  const errors = validateEvidence(
    evidence,
    requirements,
    new Set([...previousFiles, ...legacy]),
  );
  errors.push(
    ...evidenceFileErrors(evidence, new Set(files), previousFiles, (path) =>
      historicalFiles(root, base, path),
    ),
  );
  if (checkRevision) {
    const changed = vcs(root, [
      "diff",
      "--name-only",
      "--from",
      base,
      "--to",
      head,
    ])
      .trim()
      .split("\n")
      .filter(Boolean);
    const previous = new Map();
    const current = new Map();
    for (const file of previousFiles) {
      if (!/^spec\/src\/history\/E-.+\.md$/u.test(file)) continue;
      previous.set(file, vcs(root, ["file", "show", "-r", base, file]));
      if (files.includes(file)) current.set(file, read(file));
    }
    // Coverage needs the full base file set, including deleted non-evidence files.
    for (const file of previousFiles)
      if (!previous.has(file)) previous.set(file, null);
    errors.push(...revisionErrors(evidence, current, previous, changed));
  }
  return { evidence, errors };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const result = evidenceFindings(process.cwd());
    for (const error of result.errors) console.error(error);
    if (result.errors.length) process.exitCode = 1;
    else console.log(`Evidence passes (${result.evidence.length} records).`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
