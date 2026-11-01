import { execFileSync } from "node:child_process";
const run = (command, args) =>
  execFileSync(command, args, { stdio: "inherit" });
run("pnpm", [
  "exec",
  "prettier",
  "--check",
  "spec/**/*.md",
  "docs/**/*.md",
  "*.md",
]);
for (const command of ["validate", "build"])
  run("pnpm", ["exec", "spec-validator", command]);
run("pnpm", [
  "exec",
  "spec-validator",
  "first",
  "--base",
  process.env.LAPIS_DESKTOP_BASE,
  "--head",
  process.env.LAPIS_DESKTOP_HEAD,
]);
