#!/usr/bin/env node
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { buildIdentity, inventory } from "./ci-artifact-identity.mjs";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const jobs = [
  {
    marker: "../lapis-plugin-tasks/dist/index.js",
    steps: [
      [
        "../lapis-plugin-tasks",
        "pnpm",
        ["install", "--ignore-pnpmfile", "--frozen-lockfile"],
      ],
      [
        "../lapis-plugin-tasks",
        "pnpm",
        ["exec", "svelte-package", "--tsconfig", "./tsconfig.pack.json"],
      ],
    ],
  },
  {
    marker: "../lapis-notes/packages/app-profile/dist/native-chat/index.js",
    steps: [
      ["../lapis-notes", "pnpm", ["install", "--frozen-lockfile"]],
      [
        "../lapis-notes",
        "pnpm",
        ["--filter", "@lapis-notes/app-profile^...", "build"],
      ],
      ["../lapis-notes/packages/app-profile", "pnpm", ["build:native-chat"]],
    ],
  },
  {
    marker: "../lapis-ai/packages/ai/dist/index.js",
    steps: [
      ["../lapis-ai", "pnpm", ["install", "--frozen-lockfile"]],
      ["../lapis-ai", "pnpm", ["--filter", "@lapismd/ai", "build"]],
    ],
  },
];

function run(cwd, command, args) {
  const result = spawnSync(command, args, {
    cwd: resolve(root, cwd),
    stdio: "inherit",
    env: process.env,
  });
  if ((result.status ?? 1) !== 0) process.exit(result.status ?? 1);
}

const receiptPath = resolve(root, ".local/ci-prepared-links.json");
export function missingPathPackages() {
  let receipt;
  try {
    receipt = JSON.parse(readFileSync(receiptPath));
  } catch {
    /* Missing receipts require a build. */
  }
  const identity = buildIdentity(root);
  return jobs.filter((job) => {
    const marker = resolve(root, job.marker);
    if (
      !existsSync(marker) ||
      JSON.stringify(receipt?.identity) !== JSON.stringify(identity)
    )
      return true;
    return (
      JSON.stringify(receipt?.outputs?.[job.marker]) !==
      JSON.stringify(inventory(dirname(marker)))
    );
  });
}

/** Skip a build the sibling checkout does not define, and its install with it. */
export function stepsToRun(steps, hasScript) {
  const kept = steps.filter(([cwd, command, args]) => {
    const script = args[0];
    if (
      command !== "pnpm" ||
      ["install", "exec"].includes(script) ||
      script.startsWith("-")
    )
      return true;
    return hasScript(cwd, script);
  });
  if (kept.every(([, , args]) => args[0] === "install")) return [];
  return kept;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  for (const job of missingPathPackages())
    for (const [cwd, command, args] of stepsToRun(job.steps, (cwd, script) => {
      const manifest = resolve(root, cwd, "package.json");
      if (!existsSync(manifest)) return false;
      const pkg = JSON.parse(readFileSync(manifest, "utf8"));
      return Boolean(pkg.scripts?.[script]);
    }))
      run(cwd, command, args);
  const outputs = Object.fromEntries(
    jobs.map((job) => {
      const marker = resolve(root, job.marker);
      if (!existsSync(marker))
        throw Error(`Missing built public package: ${job.marker}`);
      return [job.marker, inventory(dirname(marker))];
    }),
  );
  mkdirSync(dirname(receiptPath), { recursive: true });
  writeFileSync(
    receiptPath,
    JSON.stringify({ identity: buildIdentity(root), outputs }, null, 2) + "\n",
  );
}
