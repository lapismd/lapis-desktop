#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

/** Clones the unpublished path dependencies beside this checkout. */
const repos = [
  ["agent-ui", "https://github.com/lapismd/agent-ui.git"],
  ["lapis-ai", "https://github.com/lapismd/lapis-ai.git"],
  ["lapis-notes", "https://github.com/lapismd/lapis-notes.git"],
  ["lapis-terminal", "https://github.com/lapismd/lapis-terminal.git"],
  ["jj-store", "https://github.com/stevejuma/jj-store.git"],
];
const parent = dirname(process.cwd());
for (const [name, url] of repos) {
  const destination = join(parent, name);
  if (existsSync(destination)) {
    console.log(`Path dependency present: ${destination}`);
    continue;
  }
  console.log(`Cloning ${url} into ${destination}`);
  const result = spawnSync("git", ["clone", "--depth", "1", url, destination], {
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
