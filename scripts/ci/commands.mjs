import { readdirSync } from "node:fs";
import { unitGroups } from "./impact.mjs";
export function selection(value, allowed) {
  const items = JSON.parse(value ?? JSON.stringify(allowed));
  if (
    !Array.isArray(items) ||
    new Set(items).size !== items.length ||
    items.some((x) => !allowed.includes(x))
  )
    throw Error("Invalid CI test selection");
  return items;
}
export function rustArguments(packages, e2e = false) {
  const values = packages ? JSON.parse(packages) : null;
  if (values === null) return e2e ? ["-p", "lapis-desktop"] : ["--workspace"];
  if (
    !Array.isArray(values) ||
    !values.length ||
    values.some((v) => !/^[a-z][a-z0-9_-]*$/.test(v))
  )
    throw Error("Invalid CI Rust package selection");
  return e2e
    ? values.includes("lapis-desktop")
      ? ["-p", "lapis-desktop"]
      : []
    : values.flatMap((v) => ["-p", v]);
}
export function unitCommands(env = process.env) {
  const groups = selection(env.LAPIS_CI_UNIT_GROUPS, unitGroups),
    commands = [];
  const files = groups
    .filter((g) => ["governance", "renderer"].includes(g))
    .flatMap((g) =>
      readdirSync(`tests/${g}`)
        .filter((f) => f.endsWith(".test.mjs"))
        .map((f) => `tests/${g}/${f}`),
    );
  if (files.length)
    commands.push([process.execPath, ["--import", "tsx", "--test", ...files]]);
  if (groups.includes("ai")) commands.push(["pnpm", ["test:ai"]]);
  if (groups.includes("rust"))
    commands.push([
      "cargo",
      [
        "test",
        "--manifest-path",
        "src-tauri/Cargo.toml",
        "--locked",
        ...rustArguments(env.LAPIS_CI_RUST_PACKAGES),
      ],
    ]);
  return commands;
}
export function qualityCommands(env = process.env) {
  const groups = selection(env.LAPIS_CI_QUALITY_GROUPS, ["types", "rust"]);
  const commands = [
    ["pnpm", ["exec", "prettier", "--check", "."]],
    [process.execPath, ["scripts/source-audit.mjs"]],
    ["pnpm", ["check:storybook-parity"]],
  ];
  if (groups.includes("types")) commands.push(["pnpm", ["check:types"]]);
  if (groups.includes("rust")) {
    commands.push([
      "cargo",
      [
        "fmt",
        "--manifest-path",
        "src-tauri/Cargo.toml",
        "--all",
        "--",
        "--check",
      ],
    ]);
    commands.push([
      "cargo",
      [
        "clippy",
        "--manifest-path",
        "src-tauri/Cargo.toml",
        "--all-targets",
        "--locked",
        ...rustArguments(env.LAPIS_CI_RUST_PACKAGES),
        "--",
        "-D",
        "warnings",
      ],
    ]);
    const e2e = rustArguments(env.LAPIS_CI_RUST_PACKAGES, true);
    if (e2e.length)
      commands.push([
        "cargo",
        [
          "clippy",
          "--manifest-path",
          "src-tauri/Cargo.toml",
          "--all-targets",
          "--locked",
          ...e2e,
          "--features",
          "e2e",
          "--",
          "-D",
          "warnings",
        ],
      ]);
  }
  return commands;
}
