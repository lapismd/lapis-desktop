import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const read = (path) => readFileSync(join(root, path), "utf8");
const { scripts } = JSON.parse(read("package.json"));
const lanes = JSON.parse(read("scripts/validation/lanes.json"));
const ci = read(".github/workflows/ci.yml");

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? walk(path)
      : [relative(root, path).split("\\").join("/")];
  });
}

const BUILD_SCRIPT = "scripts/local-macos-build.mjs";

test("the local macOS build is an explicit, isolated script", () => {
  assert.ok(existsSync(join(root, BUILD_SCRIPT)), `${BUILD_SCRIPT} is missing`);
  assert.equal(
    scripts["build:local:macos"],
    `node ${BUILD_SCRIPT}`,
    "build:local:macos is the sole documented entry point",
  );
  for (const [name, command] of Object.entries(scripts)) {
    if (name === "build:local:macos") continue;
    assert.ok(
      !command.includes("local-macos-build"),
      `script ${name} must not chain the local macOS build`,
    );
  }
  for (const lane of Object.values(lanes))
    assert.ok(
      !lane.includes("local-macos-build"),
      "no validation lane may collect the local macOS build",
    );
  assert.ok(
    !ci.includes("local-macos-build"),
    "CI must not run the local build",
  );
});

test("the local macOS build is ad-hoc only and refuses a real signing identity", () => {
  const source = read(BUILD_SCRIPT);
  for (const key of [
    "TAURI_SIGNING_IDENTITY",
    "APPLE_SIGNING_IDENTITY",
    "TAURI_APPLE_SIGNING_IDENTITY",
  ])
    assert.ok(
      source.includes(key),
      `${BUILD_SCRIPT} must refuse the ${key} signing identity`,
    );
  assert.match(
    source,
    /codesign[\s\S]*--sign[\s\S]*-/,
    "ad-hoc signing in use",
  );
});
