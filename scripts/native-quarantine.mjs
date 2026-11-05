import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import {
  selectQuarantines,
  quarantineNamePattern,
  quarantineVariable,
  quarantineResults,
} from "../tests/desktop/native-quarantine.mjs";

export function quarantineArguments(args) {
  const options = args.filter((arg) => arg !== "--");
  if (
    options.filter((arg) => arg.startsWith("--cases=")).length !== 1 ||
    options.some(
      (arg) =>
        !arg.startsWith("--cases=") && !arg.startsWith("--reuse-artifact="),
    ) ||
    options.filter((arg) => arg.startsWith("--reuse-artifact=")).length > 1
  )
    throw Error("Use --cases=id,id [--reuse-artifact=manifest-path].");
  const selected = selectQuarantines(
    options
      .find((arg) => arg.startsWith("--cases="))
      .slice(8)
      .split(","),
  );
  if (selected.length > 5)
    throw Error("Diagnostic batch exceeds five fresh target executions.");
  const reuseArtifact = options
    .find((arg) => arg.startsWith("--reuse-artifact="))
    ?.slice("--reuse-artifact=".length);
  if (reuseArtifact === "") throw Error("An artifact path is required.");
  return { selected, reuseArtifact };
}

export function quarantineCommand(selected) {
  return [
    "--import",
    "tsx",
    "--test",
    "--test-concurrency=1",
    "--test-reporter=./scripts/native-quarantine-reporter.mjs",
    `--test-name-pattern=${quarantineNamePattern(selected)}`,
    ...new Set(selected.map((entry) => entry.file)),
  ];
}

export function quarantineSourceSnapshot(
  environment = process.env,
  localSnapshot = () =>
    execFileSync(
      "jj",
      ["--no-pager", "log", "-r", "@", "--no-graph", "-T", "commit_id"],
      { encoding: "utf8" },
    ).trim(),
) {
  if (environment.GITHUB_ACTIONS === "true") {
    const source = environment.GITHUB_SHA;
    if (!/^[a-f0-9]{40}$/u.test(source ?? "") || /^0+$/u.test(source))
      throw new Error("Hosted quarantine diagnostics need a valid GITHUB_SHA.");
    return source;
  }
  return localSnapshot();
}

export async function runQuarantine(args) {
  const { selected, reuseArtifact } = quarantineArguments(args);
  const { nativeLaneGate } = await import("./macos-native-lanes.mjs");
  const gate = nativeLaneGate();
  if (!gate.ok) throw Error(gate.reason);
  const { prepareAcceptance, createAcceptanceEnvironment, run } = await import(
    "./desktop-acceptance.mjs"
  );
  const prepared = await prepareAcceptance({ reuseArtifact });
  const { directory, environment } = await createAcceptanceEnvironment({
    family: "quarantine",
  });
  mkdirSync(directory, { recursive: true });
  const report = join(directory, "quarantine-results.json");
  writeFileSync(
    report,
    JSON.stringify(quarantineResults(selected, []), null, 2) + "\n",
  );
  const sourceSnapshot = quarantineSourceSnapshot();
  const attempt = {
    schema: 1,
    source: prepared.identity.sourceCommit,
    sourceTree: prepared.identity.sourceTree,
    sourceSnapshot,
    started: new Date().toISOString(),
    selected: selected.map((entry) => entry.id),
    platform: `${process.platform}-${process.arch}`,
    runId: process.env.GITHUB_RUN_ID ?? null,
    runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
    automaticRetry: false,
    qualification: false,
    artifact: prepared.artifactId,
    artifactIdentity: prepared.identity,
    artifactSource: reuseArtifact ?? "freshly-prepared",
  };
  writeFileSync(
    join(directory, "quarantine-attempt.json"),
    JSON.stringify(attempt, null, 2) + "\n",
  );
  console.log(
    `Fresh quarantine diagnostic: ${directory}; no cached test reuse or automatic retry.`,
  );
  let failure;
  try {
    await run(process.execPath, quarantineCommand(selected), {
      ...environment,
      [quarantineVariable]: JSON.stringify(selected.map((entry) => entry.id)),
      LAPIS_DESKTOP_QUARANTINE_REPORT: report,
    });
  } catch (error) {
    failure = error;
  }
  let result;
  try {
    result = JSON.parse(readFileSync(report, "utf8"));
  } catch {
    throw Error(`Quarantine report missing or unreadable: ${report}`, {
      cause: failure,
    });
  }
  result.attempt = { ...attempt, finished: new Date().toISOString() };
  result.runnerFailed = Boolean(failure);
  result.ok &&= !failure;
  writeFileSync(report, JSON.stringify(result, null, 2) + "\n");
  if (failure) throw failure;
  if (!result.ok || result.executed !== selected.length)
    throw Error(
      `Selected quarantine cases did not all execute and pass: ${report}`,
    );
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  runQuarantine(process.argv.slice(2)).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
