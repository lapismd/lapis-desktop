import { readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateNativeCoverage } from "./native-scope-inventory.mjs";

export const nativeInventory = JSON.parse(
  readFileSync(
    new URL("native-family-inventory.json", import.meta.url),
    "utf8",
  ),
);
export const nativeFamilies = nativeInventory.families;

export function validateNativeInventory(inventory = nativeInventory) {
  if (inventory.schema !== 1 || !Array.isArray(inventory.files))
    throw Error("Unsupported native family inventory");
  const seen = new Set();
  for (const entry of inventory.files) {
    if (
      !nativeFamilies.includes(entry.family) ||
      !["startup", "wdio", "feature", "resource"].includes(entry.mode) ||
      !/^tests\/desktop\/[a-z0-9-]+\.(test|spec)\.mjs$/u.test(entry.file) ||
      seen.has(entry.file)
    )
      throw Error(`Invalid or duplicate native inventory entry: ${entry.file}`);
    seen.add(entry.file);
  }
  for (const family of nativeFamilies)
    if (!inventory.files.some((entry) => entry.family === family))
      throw Error(`Empty native family: ${family}`);
  return inventory;
}
validateNativeInventory();
// Planning is a required gate: a new unowned native test must not silently disappear
// even when an unknown path selects every existing family.
validateNativeCoverage({ headed: nativeInventory.files });

export function nativeFamiliesForFile(file) {
  const entry = nativeInventory.files.find((entry) => entry.file === file);
  // Unknown ownership must never narrow production or harness coverage.
  return entry ? [...new Set(["smoke", entry.family])] : [...nativeFamilies];
}

export function selectNativeFamilies(family = "all") {
  if (family === "all") return [...nativeFamilies];
  if (!nativeFamilies.includes(family))
    throw Error(`Unknown native family: ${family}`);
  return [family];
}

export function nativeStages(family) {
  if (!nativeFamilies.includes(family))
    throw Error(`Unknown concrete native family: ${family}`);
  return ["startup", "wdio", "feature", "resource"].flatMap((mode) => {
    const files = nativeInventory.files
      .filter((entry) => entry.family === family && entry.mode === mode)
      .map((entry) => entry.file);
    return files.length ? [{ id: mode, files }] : [];
  });
}

export function parseAcceptanceArgs(argv) {
  const args = argv.filter((arg) => arg !== "--");
  const options = { operation: "all", family: "all", reuseArtifact: undefined };
  const seen = new Set();
  for (let index = 0; index < args.length; index++) {
    const [flag, inline] = args[index].split(/=(.*)/su);
    const key = {
      "--operation": "operation",
      "--family": "family",
      "--reuse-artifact": "reuseArtifact",
    }[flag];
    if (!key || seen.has(key))
      throw Error(`Unknown or duplicate native option: ${flag}`);
    const value = inline ?? args[++index];
    if (!value || value.startsWith("--"))
      throw Error(`Missing value for ${flag}`);
    seen.add(key);
    options[key] = value;
  }
  if (!["all", "prepare", "execute"].includes(options.operation))
    throw Error(`Unknown native operation: ${options.operation}`);
  selectNativeFamilies(options.family);
  if (options.operation === "prepare" && options.family !== "all")
    throw Error("Native preparation builds one artifact for all families");
  if (options.operation === "execute" && !options.reuseArtifact)
    throw Error(
      "Execution-only native acceptance requires a verified --reuse-artifact",
    );
  return options;
}

export function validNativeCounts(counts) {
  return Boolean(
    counts &&
      ["tests", "passed", "failed", "cancelled", "skipped"].every(
        (key) => Number.isSafeInteger(counts[key]) && counts[key] >= 0,
      ) &&
      counts.tests >=
        counts.passed + counts.failed + counts.cancelled + counts.skipped &&
      counts.passed > 0 &&
      counts.failed === 0 &&
      counts.cancelled === 0,
  );
}

export function validateNativeReports(expected, reports, identity = {}) {
  if (
    !Array.isArray(expected) ||
    !expected.length ||
    new Set(expected).size !== expected.length
  )
    throw Error(
      "Native aggregation needs a nonempty distinct family selection",
    );
  expected.forEach((family) => {
    if (!nativeFamilies.includes(family))
      throw Error(`Unknown selected native family: ${family}`);
  });
  if (reports.length !== expected.length)
    throw Error("Missing or extra native family reports");
  const seen = new Set();
  for (const report of reports) {
    if (!expected.includes(report.family) || seen.has(report.family))
      throw Error("Unexpected or duplicate native family report");
    seen.add(report.family);
    if (report.schema !== 1 || report.status !== "passed")
      throw Error(`Native family did not pass: ${report.family}`);
    for (const key of [
      "sourceRevision",
      "profile",
      "runId",
      "runAttempt",
      "artifactId",
    ]) {
      const wanted = identity[key] ?? reports[0]?.[key];
      if (!wanted || report[key] !== wanted)
        throw Error(`Native report ${key} mismatch`);
    }
    const stages = nativeStages(report.family);
    if (report.stages?.length !== stages.length)
      throw Error(`Incomplete native stages: ${report.family}`);
    for (const [index, stage] of stages.entries()) {
      const actual = report.stages[index];
      if (
        actual.id !== stage.id ||
        JSON.stringify(actual.files) !== JSON.stringify(stage.files) ||
        actual.status !== "passed" ||
        !validNativeCounts(actual.counts)
      )
        throw Error(
          `Incomplete or failed native stage: ${report.family}/${stage.id}`,
        );
    }
  }
  return { status: "passed", selected: expected, reports: reports.length };
}

function main(argv) {
  const [command, planPath, directory] = argv;
  if (command !== "aggregate" || !planPath || !directory || argv.length !== 3)
    throw Error(
      "Use native-families.mjs aggregate <plan.json> <reports-directory>",
    );
  const plan = JSON.parse(readFileSync(planPath, "utf8"));
  const expected = plan.nativeFamilies;
  const reports = readdirSync(directory, { recursive: true })
    .filter((name) => /native-family-[a-z]+\.json$/u.test(name))
    .map((name) => JSON.parse(readFileSync(join(directory, name), "utf8")));
  const result = validateNativeReports(expected, reports, {
    sourceRevision: process.env.GITHUB_SHA,
    profile: plan.profile,
    runId: process.env.GITHUB_RUN_ID,
    runAttempt: process.env.GITHUB_RUN_ATTEMPT,
  });
  console.log(JSON.stringify(result));
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
