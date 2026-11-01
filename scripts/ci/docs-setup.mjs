import { existsSync } from "node:fs";
import { cp, mkdir, symlink } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
if (!process.env.RUNNER_TEMP || existsSync("node_modules"))
  throw Error(
    "Docs setup requires a fresh checkout and runner temporary directory",
  );
const directory = join(process.env.RUNNER_TEMP, "lapis-desktop-docs-tools");
await mkdir(directory, { recursive: true });
for (const name of ["package.json", "pnpm-lock.yaml"])
  await cp(join(".github/ci-docs", name), join(directory, name));
execFileSync("pnpm", ["install", "--frozen-lockfile", "--ignore-scripts"], {
  cwd: directory,
  stdio: "inherit",
});
await symlink(join(directory, "node_modules"), "node_modules", "dir");
