import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { catalogArguments } from "./validation/catalog.mjs";
import {
  catalogFiles,
  catalogOptions,
  displayVariants,
  storyFiles,
} from "./catalog-profile.mjs";

const { profile, args } = catalogOptions(process.argv.slice(2));
const shard = args.find((arg) => arg.startsWith("--shard="))?.slice(8) ?? "all";
if (
  shard !== "all" &&
  (!/^[1-9]\d*\/[1-9]\d*$/.test(shard) ||
    Number(shard.split("/")[0]) > Number(shard.split("/")[1]))
)
  throw Error("Unknown catalog shard");
const directory = resolve(
  ".local/catalog-reports",
  profile,
  shard.replace("/", "-"),
  randomUUID(),
);
await mkdir(directory, { recursive: true });
const files = storyFiles();
const report = {
  schema: 1,
  profile,
  shard,
  arguments: args,
  testedRevision:
    process.env.GITHUB_SHA ?? process.env.LAPIS_DESKTOP_HEAD ?? null,
  started: new Date().toISOString(),
  variants: displayVariants.map((variant) => ({
    ...variant,
    status: "not-executed",
  })),
};
await writeFile(
  resolve(directory, "summary.json"),
  JSON.stringify(report, null, 2),
);
for (const { viewport, theme } of displayVariants) {
  const selected = catalogFiles(profile, viewport, theme, files);
  const output = resolve(directory, `${viewport}-${theme}.json`);
  // Remove prior-attempt results before spawning; stale output is never evidence.
  await writeFile(output, "");
  const started = Date.now();
  console.log(
    `Desktop catalog (${profile}, shard ${shard}): ${viewport}/${theme}, ${selected.length}/${files.length} story files before caller filters and sharding`,
  );
  let terminationSignal = null;
  let cancelled = false;
  const result = await new Promise((resolve, reject) => {
    const child = spawn(
      "pnpm",
      [
        "exec",
        "vitest",
        "run",
        "--config",
        "vitest.catalog.config.ts",
        ...catalogArguments(args, viewport, theme),
        ...(args.some((argument) => /^--reporter(?:=|$)/.test(argument))
          ? []
          : ["--reporter=default"]),
        "--reporter=./scripts/catalog-reporter.mjs",
      ],
      {
        stdio: "inherit",
        env: {
          ...process.env,
          LAPIS_CATALOG_VIEWPORT: viewport,
          LAPIS_CATALOG_THEME: theme,
          LAPIS_DESKTOP_CATALOG_PROFILE: profile,
          LAPIS_CATALOG_REPORT: output,
        },
      },
    );
    const stop = () => {
      cancelled = true;
      child.kill("SIGTERM");
    };
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
    child.once("error", (error) => {
      process.removeListener("SIGINT", stop);
      process.removeListener("SIGTERM", stop);
      reject(error);
    });
    child.once("exit", (code, signal) => {
      process.removeListener("SIGINT", stop);
      process.removeListener("SIGTERM", stop);
      terminationSignal = signal;
      resolve(code ?? 1);
    });
  });
  let details;
  try {
    details = JSON.parse(await readFile(output, "utf8"));
  } catch {
    // Preserve the failed attempt even when a crash prevents a Vitest report.
  }
  const executed =
    (details?.numPassedTests ?? 0) + (details?.numFailedTests ?? 0);
  const passed = result === 0 && executed > 0 && details?.success === true;
  report.variants[
    displayVariants.findIndex(
      (variant) => variant.viewport === viewport && variant.theme === theme,
    )
  ] = {
    viewport,
    theme,
    status: passed
      ? "passed"
      : cancelled || terminationSignal
        ? "cancelled"
        : "failed",
    exitCode: result,
    signal: terminationSignal,
    durationMs: Date.now() - started,
    executed,
    passed: details?.numPassedTests ?? 0,
    failed: details?.numFailedTests ?? 0,
    skipped: details?.numPendingTests ?? 0,
    notSelectedFiles: files.length - selected.length,
    files:
      details?.testResults?.map((file) => ({
        name: file.name,
        status: file.status,
        durationMs: file.endTime - file.startTime,
      })) ?? [],
  };
  await writeFile(
    resolve(directory, "summary.json"),
    JSON.stringify(report, null, 2),
  );
  if (!passed) {
    console.error(
      `Catalog ${viewport}/${theme} failed or executed no tests; reports: ${directory}`,
    );
    process.exit(result || 1);
  }
}
