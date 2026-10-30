#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const jobs = [
  {
    marker: "../agent-ui/packages/agent-ui/dist/index.js",
    steps: [
      ["../agent-ui", "pnpm", ["install", "--frozen-lockfile"]],
      ["../agent-ui", "pnpm", ["--filter", "@lapismd/agent-ui", "build"]],
    ],
  },
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
    marker:
      "../lapis-plugins/packages/history/dist/repository/controllers/native-indexed-search.js",
    steps: [
      ["../lapis-plugins", "pnpm", ["install", "--frozen-lockfile"]],
      ["../lapis-plugins/packages/history", "pnpm", ["build"]],
    ],
  },
  {
    marker: "../lapis-plugins/packages/bases/dist/index.js",
    steps: [
      ["../lapis-plugins", "pnpm", ["install", "--frozen-lockfile"]],
      ["../lapis-plugins/packages/bases", "pnpm", ["build"]],
    ],
  },
  {
    marker: "../lapis-notes/packages/workspace/dist/index.js",
    steps: [
      ["../lapis-notes", "pnpm", ["install", "--frozen-lockfile"]],
      [
        "../lapis-notes",
        "pnpm",
        ["--filter", "@lapis-notes/workspace^...", "build"],
      ],
      ["../lapis-notes/packages/workspace", "pnpm", ["build"]],
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
}
