import {
  mkdtempSync,
  mkdirSync,
  symlinkSync,
  existsSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
  appendFileSync,
} from "node:fs";
import { resolve, join } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { fixtureJjBinary } from "../tests/desktop/native-tools.mjs";
import { nativeBuildEnvironment } from "./validation/model.mjs";
import { nativeBuildEnvironment as nativeEnvironment } from "./native-build-environment.mjs";
import {
  nativeStages,
  parseAcceptanceArgs,
  selectNativeFamilies,
  validNativeCounts,
} from "./native-families.mjs";

export async function run(command, args, env = process.env) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { stdio: "inherit", env });
    let cancelled = false;
    const stop = () => {
      cancelled = true;
      child.kill("SIGTERM");
    };
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
    const detach = () => {
      process.removeListener("SIGINT", stop);
      process.removeListener("SIGTERM", stop);
    };
    child.once("error", (error) => {
      detach();
      reject(error);
    });
    child.once("exit", (code, signal) => {
      detach();
      if (code === 0 && !cancelled) resolveRun();
      else {
        const error = new Error(`${command} exited with ${signal ?? code}`);
        error.cancelled = cancelled;
        reject(error);
      }
    });
  });
}
export async function buildAcceptanceApp(execute = run) {
  await execute(
    "pnpm",
    [
      "exec",
      "tauri",
      "build",
      "--debug",
      "--bundles",
      "app",
      "--features",
      "e2e",
      "--config",
      "src-tauri/tauri.e2e.conf.json",
    ],
    { ...process.env, ...nativeBuildEnvironment("build") },
  );
}

/** Preparation owns the build; execution-only consumers must verify its complete identity. */
export async function prepareAcceptance({ execute = run, reuseArtifact } = {}) {
  if (reuseArtifact) {
    const { verifyAcceptance } = await import("./ci-acceptance-artifact.mjs");
    const prepared = verifyAcceptance(reuseArtifact);
    process.env.LAPIS_DESKTOP_ACCEPTANCE_BINARY = prepared.acceptanceBinary;
    process.env.LAPIS_DESKTOP_PORTABLE_FIXTURES = prepared.portableFixtures;
    return {
      ...prepared,
      artifactId: createHash("sha256")
        .update(readFileSync(prepared.manifestPath))
        .digest("hex"),
    };
  }
  const { prepareDistributionFixtures } = await import(
    "../tests/desktop/distribution-fixtures.mjs"
  );
  // Only public fixture material is embedded. The ephemeral signing key stays in memory.
  prepareDistributionFixtures();
  await execute(process.execPath, ["scripts/prepare-acp-acceptance.mjs"]);
  await buildAcceptanceApp(execute);
  const { buildIdentity } = await import("./ci-artifact-identity.mjs");
  const identity = buildIdentity(process.cwd(), "acceptance");
  return {
    identity,
    artifactId: createHash("sha256")
      .update(JSON.stringify(identity))
      .digest("hex"),
  };
}

/** Every family/diagnostic attempt owns fresh mutable state, including geometry. */
export function createAcceptanceEnvironment({ family = "all" } = {}) {
  if (!/^[a-z-]+$/u.test(family)) throw Error("Invalid native attempt name");
  mkdirSync(".local/native-test", { recursive: true });
  const directory = mkdtempSync(resolve(`.local/native-test/${family}-`));
  const vault = join(directory, "vault-笔记 café");
  mkdirSync(vault);
  writeFileSync(join(vault, "Welcome.md"), "# A native vault\n");
  copyFileSync("src-tauri/icons/icon.png", join(vault, "café.png"));
  const bin = join(directory, "bin");
  mkdirSync(bin);
  symlinkSync(process.execPath, join(bin, "node"));
  return {
    directory,
    environment: {
      ...nativeEnvironment(),
      PATH: `${bin}:/usr/bin:/bin`,
      LAPIS_DESKTOP_FIXTURE_JJ: fixtureJjBinary(),
      LAPIS_DESKTOP_ACCEPTANCE_STATE: join(directory, "window-state.json"),
      LAPIS_DESKTOP_ACCEPTANCE_ROOT: directory,
    },
  };
}

export async function executeNativeFamily(
  family,
  prepared,
  execute = run,
  createEnvironment = createAcceptanceEnvironment,
) {
  const { directory, environment } = createEnvironment({ family });
  const report = {
    schema: 1,
    family,
    status: "running",
    artifactId: prepared.artifactId,
    sourceRevision: prepared.identity.sourceCommit,
    sourceTree: prepared.identity.sourceTree,
    profile: process.env.LAPIS_CI_PROFILE ?? "full",
    runId: process.env.GITHUB_RUN_ID ?? directory,
    runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? "1",
    startedAt: new Date().toISOString(),
    stages: nativeStages(family).map((stage) => ({
      ...stage,
      status: "not-executed",
    })),
  };
  const reportDirectory = process.env.LAPIS_DESKTOP_NATIVE_REPORTS ?? directory;
  mkdirSync(reportDirectory, { recursive: true });
  const reportPath = join(reportDirectory, `native-family-${family}.json`);
  const save = () =>
    writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
  save();
  const started = performance.now(),
    failures = [];
  for (const stage of report.stages) {
    const stageStarted = performance.now();
    const countsPath = join(directory, `${stage.id}-counts.json`);
    stage.status = "running";
    save();
    try {
      if (stage.id === "wdio") {
        await execute(
          resolve("node_modules/.bin/wdio"),
          ["run", "tests/desktop/wdio.conf.mjs"],
          {
            ...environment,
            LAPIS_DESKTOP_NATIVE_COUNTS: countsPath,
          },
        );
      } else {
        await execute(
          process.execPath,
          [
            ...(stage.id === "feature" ? ["--import", "tsx"] : []),
            "--test",
            "--test-concurrency=1",
            "--test-reporter=spec",
            "--test-reporter-destination=stdout",
            "--test-reporter=./scripts/native-count-reporter.mjs",
            `--test-reporter-destination=${countsPath}`,
            ...stage.files,
          ],
          stage.id === "resource"
            ? { ...environment, PATH: process.env.PATH }
            : environment,
        );
      }
      stage.counts = JSON.parse(readFileSync(countsPath, "utf8"));
      if (!validNativeCounts(stage.counts))
        throw Error(
          `Native stage executed no passing cases or retained failures: ${stage.id}`,
        );
      if (family === "smoke" && stage.id === "feature") {
        if (!existsSync(environment.LAPIS_DESKTOP_ACCEPTANCE_STATE))
          throw Error(
            "The native window-state plugin did not persist geometry.",
          );
        const geometry = JSON.parse(
          readFileSync(environment.LAPIS_DESKTOP_ACCEPTANCE_STATE, "utf8"),
        );
        if (!(geometry.main?.width > 0 && geometry.main?.height > 0))
          throw Error("Native geometry evidence is empty");
      }
      stage.status = "passed";
    } catch (error) {
      stage.status = "failed";
      stage.error = error.message;
      if (existsSync(countsPath)) {
        try {
          stage.counts = JSON.parse(readFileSync(countsPath, "utf8"));
        } catch (reportError) {
          stage.reportError = reportError.message;
        }
      }
      failures.push(error);
      if (error.cancelled) {
        stage.status = "cancelled";
        break;
      }
    } finally {
      stage.durationMs = Math.round(performance.now() - stageStarted);
      save();
    }
  }
  report.durationMs = Math.round(performance.now() - started);
  report.status = failures.some((error) => error.cancelled)
    ? "cancelled"
    : failures.length
      ? "failed"
      : "passed";
  save();
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `### Native ${family}: ${report.status}\n\nSource: ${report.sourceRevision}; profile: ${report.profile}; artifact: ${report.artifactId}\n\n` +
        report.stages
          .map(
            (stage) =>
              `- ${stage.id}: ${stage.status}, ${stage.durationMs} ms; ${JSON.stringify(stage.counts ?? { notExecuted: true })}\n`,
          )
          .join(""),
    );
  if (failures.length) {
    const error = new AggregateError(
      failures,
      `Native ${family} acceptance failed`,
    );
    error.cancelled = report.status === "cancelled";
    throw error;
  }
  return report;
}

export async function acceptance(args = process.argv.slice(2), execute = run) {
  const options = parseAcceptanceArgs(args);
  if (process.platform !== "darwin" || process.arch !== "arm64")
    throw Error("M0.1 native acceptance requires macOS ARM64.");
  const prepared = await prepareAcceptance({
    execute,
    reuseArtifact: options.reuseArtifact,
  });
  if (options.operation === "prepare") return prepared;
  const failures = [];
  for (const family of selectNativeFamilies(options.family)) {
    try {
      await executeNativeFamily(family, prepared, execute);
    } catch (error) {
      if (error.cancelled) throw error;
      failures.push(error);
    }
  }
  if (failures.length)
    throw new AggregateError(failures, "Native acceptance families failed");
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  acceptance().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
