import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { skipSpecification } from "../dependency-automation/spec-policy.mjs";

export function runDocumentationChecks({
  env = process.env,
  run = execFileSync,
} = {}) {
  const invoke = (args) => run("pnpm", args, { stdio: "inherit", env });
  invoke([
    "exec",
    "prettier",
    "--check",
    "spec/**/*.md",
    "docs/**/*.md",
    "*.md",
  ]);
  for (const command of ["validate", "build", "first"]) {
    if (skipSpecification(`spec:${command}`, env)) continue;
    invoke([
      "exec",
      "spec-validator",
      command,
      ...(command === "first"
        ? ["--base", env.LAPIS_DESKTOP_BASE, "--head", env.LAPIS_DESKTOP_HEAD]
        : []),
    ]);
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  runDocumentationChecks();
