import {
  appendFileSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
const directory = ".local/ci-timing";
export function recordTiming(entry, environment = process.env) {
  mkdirSync(directory, { recursive: true });
  const record = {
    ...entry,
    sourceRevision: environment.GITHUB_SHA ?? null,
    runId: environment.GITHUB_RUN_ID ?? null,
    attempt: environment.GITHUB_RUN_ATTEMPT ?? null,
    job: environment.GITHUB_JOB ?? null,
    platform: process.platform,
    architecture: process.arch,
    profile: environment.LAPIS_DESKTOP_CI_PROFILE ?? null,
  };
  appendFileSync(`${directory}/events.jsonl`, JSON.stringify(record) + "\n");
  if (environment.GITHUB_STEP_SUMMARY)
    appendFileSync(
      environment.GITHUB_STEP_SUMMARY,
      `
| Phase | Duration | Result | Cache hit | Effective identity |
| --- | --- | --- | --- | --- |
| ${entry.label} | ${entry.durationMs} ms | ${entry.result} | ${entry.cacheHit ?? "n/a"} | ${entry.identity ?? ""} |\n`,
    );
  console.log(
    `CI timing: ${entry.label}: ${entry.durationMs} ms (${entry.result})`,
  );
}
function optionalTiming(callback) {
  try {
    return callback();
  } catch (error) {
    console.error(`CI timing unavailable: ${error.message}`);
  }
}
export async function timedCommand(label, command, args) {
  const started = Date.now();
  let result = "failure";
  try {
    await new Promise((accept, reject) => {
      const child = spawn(command, args, { stdio: "inherit" });
      const stop = (signal) => child.kill(signal);
      const interrupt = () => stop("SIGINT"),
        terminate = () => stop("SIGTERM");
      process.once("SIGINT", interrupt);
      process.once("SIGTERM", terminate);
      const cleanup = () => {
        process.removeListener("SIGINT", interrupt);
        process.removeListener("SIGTERM", terminate);
      };
      child.once("error", (error) => {
        cleanup();
        reject(error);
      });
      child.once("exit", (code, signal) => {
        cleanup();
        if (code === 0) accept();
        else
          reject(
            Object.assign(new Error(`${label} exited with ${signal ?? code}`), {
              exitCode: code ?? 1,
            }),
          );
      });
    });
    result = "success";
  } finally {
    optionalTiming(() =>
      recordTiming({
        label,
        started,
        durationMs: Date.now() - started,
        result,
      }),
    );
  }
}
export async function main([operation, label, ...args]) {
  if (!/^[a-z0-9-]+$/.test(label ?? "")) throw Error("Invalid timing label");
  if (operation === "run" && args[0] === "--" && args[1])
    return timedCommand(label, args[1], args.slice(2));
  if (operation === "start" || operation === "finish")
    return optionalTiming(() => {
      mkdirSync(directory, { recursive: true });
      const marker = `${directory}/${label}.json`;
      if (operation === "start")
        return writeFileSync(marker, JSON.stringify({ started: Date.now() }));
      if (operation === "finish") {
        const { started } = JSON.parse(readFileSync(marker, "utf8"));
        return recordTiming({
          label,
          started,
          durationMs: Date.now() - started,
          result: process.env.TIMING_RESULT ?? "unknown",
          cacheHit: process.env.CACHE_HIT ?? "unknown",
          identity: process.env.CACHE_IDENTITY ?? "unknown",
        });
      }
    });
  throw Error(
    "Use timing.mjs run <label> -- <command> [args], start <label>, or finish <label>",
  );
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = error.exitCode ?? 1;
  });
