import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import {
  liveProviderEnvironment,
  liveProviderGate,
  liveProviderHelpers,
  liveProviderSpecs,
} from "../../scripts/live-provider-tests.mjs";

const root = resolve(import.meta.dirname, "../..");
const read = (path) => readFileSync(join(root, path), "utf8");
function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? walk(path)
      : [relative(root, path).split("\\").join("/")];
  });
}
/** Every lane that runs without an explicit live opt-in. */
const defaultLanes = [
  "scripts/validation/lanes.json",
  "scripts/desktop-acceptance.mjs",
  "scripts/desktop-api-tests.mjs",
  "scripts/desktop-tests.mjs",
  "scripts/catalog-tests.mjs",
  "scripts/validation/catalog.mjs",
  "vitest.ai.config.mjs",
  "vitest.catalog.config.ts",
  "vitest.workers.config.ts",
  ...walk(resolve(root, ".storybook")),
];
const live = [...liveProviderSpecs, ...liveProviderHelpers];

test("the live inventory covers every spec that can select a real agent", () => {
  // This audit names the opt-in variables in order to enforce them.
  const self = relative(root, fileURLToPath(import.meta.url))
    .split("\\")
    .join("/");
  const candidates = walk(resolve(root, "tests")).filter(
    (path) => path !== self && (path.endsWith(".mjs") || path.endsWith(".ts")),
  );
  for (const path of candidates) {
    const source = read(path);
    const selects = liveProviderEnvironment.some((name) =>
      source.includes(name),
    );
    if (!selects) continue;
    const listed = path.endsWith(".test.mjs")
      ? liveProviderSpecs.includes(path)
      : liveProviderHelpers.includes(path);
    assert.ok(
      listed,
      `${path} can select a real agent/provider but is absent from the opt-in inventory`,
    );
  }
  for (const path of live)
    assert.ok(
      read(path).length > 0,
      `${path} is inventoried as a live spec but does not exist`,
    );
  assert.equal(
    new Set(live).size,
    live.length,
    "The live inventory must not duplicate a path",
  );
});

test("no default lane collects a live agent/provider spec", () => {
  for (const lane of defaultLanes) {
    const source = read(lane);
    for (const path of live) {
      const name = path.split("/").pop();
      assert.ok(
        !source.includes(path) && !source.includes(name),
        `${lane} must not reference live spec ${path}`,
      );
    }
    assert.ok(
      !source.includes("live-provider-tests"),
      `${lane} must not chain the opt-in live runner`,
    );
  }
  const lanes = JSON.parse(read("scripts/validation/lanes.json"));
  for (const [name, command] of Object.entries(lanes))
    assert.ok(
      !/tests\/desktop\//u.test(command),
      `lane ${name} must not collect tests/desktop specs`,
    );
});

test("package.json exposes live acceptance only as an explicit opt-in script", () => {
  const { scripts } = JSON.parse(read("package.json"));
  assert.equal(
    scripts["test:provider:live"],
    "node scripts/live-provider-tests.mjs",
  );
  for (const [name, command] of Object.entries(scripts)) {
    if (name === "test:provider:live") continue;
    assert.ok(
      !command.includes("live-provider-tests"),
      `${name} must not chain the live runner`,
    );
    for (const path of live)
      assert.ok(
        !command.includes(path),
        `${name} must not run live spec ${path}`,
      );
  }
});

test("each live spec keeps its own explicit opt-in skip guard", () => {
  for (const path of liveProviderSpecs) {
    const source = read(path);
    assert.match(
      source,
      /skip:/u,
      `${path} must skip without an explicit opt-in`,
    );
    assert.ok(
      liveProviderEnvironment.some((name) => source.includes(name)),
      `${path} must gate on a documented live opt-in variable`,
    );
  }
});

test("the runner refuses to start without an explicit qualified configuration", () => {
  assert.equal(liveProviderGate({}).ok, false);
  assert.match(
    liveProviderGate({}).reason,
    /explicit LAPIS_AI_TEST_RUNTIME_CONFIG/u,
  );
  assert.equal(
    liveProviderGate({
      LAPIS_AI_TEST_RUNTIME_CONFIG: join(
        root,
        ".local/absent-live-config.json",
      ),
    }).ok,
    false,
  );
  const directory = mkdtempSync(join(tmpdir(), "live-provider-gate-"));
  const configuration = join(directory, "ai-runtime.json");
  writeFileSync(configuration, "{}\n", { mode: 0o600 });
  const gate = liveProviderGate({
    LAPIS_AI_TEST_RUNTIME_CONFIG: configuration,
  });
  assert.equal(gate.ok, true);
  assert.deepEqual(gate.requested, ["LAPIS_AI_TEST_RUNTIME_CONFIG"]);
});
