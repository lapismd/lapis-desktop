#!/usr/bin/env node
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const jobs = [
  {
    marker: "../agent-ui/packages/repository-ui/dist/index.js",
    steps: [
      ["../agent-ui", "pnpm", ["install", "--frozen-lockfile"]],
      ["../agent-ui/packages/agent-ui", "pnpm", ["build"]],
      ["../agent-ui/packages/repository-ui", "pnpm", ["build"]],
    ],
  },
  {
    marker: "../lapis-notes/packages/app-profile/dist/native-chat/index.js",
    steps: [
      ["../lapis-notes", "pnpm", ["install", "--frozen-lockfile"]],
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
  {
    marker: "../lapis-terminal/packages/terminal/dist/index.js",
    steps: [
      ["../lapis-terminal", "pnpm", ["install", "--frozen-lockfile"]],
      ["../lapis-terminal", "pnpm", ["--filter", "@lapismd/terminal", "build"]],
    ],
  },
  {
    marker: "../jj-store/packages/jj-conversations/dist/index.js",
    steps: [
      ["../jj-store", "pnpm", ["install", "--frozen-lockfile"]],
      [
        "../jj-store",
        "pnpm",
        ["--filter", "@lapismd/jj-conversations", "build"],
      ],
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

export function missingPathPackages() {
  return jobs.filter((job) => !existsSync(resolve(root, job.marker)));
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  for (const job of missingPathPackages())
    for (const [cwd, command, args] of job.steps) run(cwd, command, args);
}
