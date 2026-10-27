import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { validationConfig } from "../../scripts/validation/model.mjs";
import {
  macosNativeLanes,
  nativeLaneGate,
  nativeLaneOptIn,
  selectNativeLane,
} from "../../scripts/macos-native-lanes.mjs";

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
/** Lane entry points that run without an explicit on-demand request. */
const defaultSurfaces = [
  "scripts/validation/lanes.json",
  "scripts/desktop-tests.mjs",
  "scripts/catalog-tests.mjs",
  "scripts/validation.mjs",
  "scripts/validation/catalog.mjs",
  "vitest.ai.config.mjs",
  "vitest.catalog.config.ts",
  "vitest.workers.config.ts",
  ...walk(resolve(root, ".storybook")),
];
const nativeScripts = macosNativeLanes.map((lane) => lane.script);

test("Docker is the code-level default validation runtime", () => {
  // The Docker worker exports LAPIS_DESKTOP_VALIDATION_RUNTIME=native for its
  // nested in-container dispatch, so the default must be asserted against an
  // explicit empty environment rather than the ambient one.
  assert.equal(
    validationConfig({}, {}).runtime,
    "docker",
    "the code-level default runtime is Docker",
  );
  assert.equal(
    validationConfig({ runtime: "native" }, {}).runtime,
    "native",
    "an explicit ignored local selection still wins",
  );
  assert.equal(
    validationConfig({}, { LAPIS_DESKTOP_VALIDATION_RUNTIME: "native" })
      .runtime,
    "native",
    "the documented environment override still selects the host",
  );
  assert.throws(
    () => validationConfig({ runtime: "host" }, {}),
    /Invalid validation runtime/u,
  );
  assert.match(
    read("scripts/validation/worker.mjs"),
    /LAPIS_DESKTOP_VALIDATION_RUNTIME\s*=\s*"native"/u,
    "only the worker's nested dispatch may pin the native runtime",
  );
  for (const command of Object.values(lanes))
    assert.ok(
      !command.includes("LAPIS_DESKTOP_VALIDATION_RUNTIME"),
      `lane command must not pin a runtime: ${command}`,
    );
});

test("the on-demand inventory covers every lane that bypasses the portable runner", () => {
  for (const lane of macosNativeLanes) {
    assert.ok(scripts[lane.script], `${lane.script} is inventoried but absent`);
    assert.ok(
      lane.needs.length > 0,
      `${lane.name} must state why it is native`,
    );
    if (!lane.delegate)
      assert.ok(
        !scripts[lane.script].includes("validation.mjs"),
        `${lane.script} must stay an explicit native lane`,
      );
    else
      assert.ok(read(lane.delegate).length > 0, `${lane.delegate} is missing`);
  }
  const dispatcher = "test:native:macos";
  assert.equal(
    scripts[dispatcher],
    "node scripts/macos-native-lanes.mjs",
    "the dispatcher is the only documented on-demand entry point",
  );
  const bypassing = Object.entries(scripts).filter(
    ([name, command]) =>
      /^test(?::|$)/.test(name) &&
      !/^test:visual(?::|$)/.test(name) &&
      !command.includes("validation.mjs"),
  );
  assert.deepEqual(
    bypassing.map(([name]) => name).sort(),
    [...nativeScripts, dispatcher].sort(),
    "every test script outside the portable runner must be inventoried",
  );
  assert.equal(
    new Set(nativeScripts).size,
    nativeScripts.length,
    "the inventory must not duplicate a script",
  );
});

test("no default lane collects an on-demand macOS lane", () => {
  for (const surface of defaultSurfaces) {
    if (surface === "scripts/desktop-tests.mjs") continue;
    const source = read(surface);
    for (const name of nativeScripts)
      assert.ok(
        !source.includes(name),
        `${surface} must not collect the on-demand lane ${name}`,
      );
    assert.ok(
      !source.includes("macos-native-lanes"),
      `${surface} must not chain the on-demand dispatcher`,
    );
    assert.ok(
      !source.includes(nativeLaneOptIn),
      `${surface} must not set the on-demand opt-in itself`,
    );
  }
  // The quiet dispatcher documents the separate headed lane in prose, so assert
  // its actual dispatch targets instead of scanning for a name.
  const dispatched = [
    ...read("scripts/desktop-tests.mjs").matchAll(
      /execute\(\s*"pnpm",\s*\[\s*"([^"]+)"/gu,
    ),
  ].map((match) => match[1]);
  assert.deepEqual([...new Set(dispatched)].sort(), ["test", "test:storybook"]);
  assert.ok(!lanes["test:desktop"].includes("--headed"));
  assert.ok(!lanes["test:desktop:headless"].includes("--headed"));
  for (const [name, command] of Object.entries(scripts)) {
    if (nativeScripts.includes(name) || name === "test:native:macos") continue;
    for (const native of nativeScripts)
      assert.ok(
        !command.includes(native),
        `default script ${name} must not chain ${native}`,
      );
    assert.ok(
      !command.includes("macos-native-lanes") &&
        !command.includes("desktop-acceptance"),
      `default script ${name} must not chain native acceptance`,
    );
  }
});

test("the dispatcher refuses without an explicit on-demand request", () => {
  assert.equal(nativeLaneGate({}).ok, false);
  assert.match(nativeLaneGate({}).reason, /LAPIS_DESKTOP_NATIVE_LANE=1/u);
  assert.equal(
    nativeLaneGate({ [nativeLaneOptIn]: "1" }, "linux", "x64").ok,
    false,
  );
  assert.match(
    nativeLaneGate({ [nativeLaneOptIn]: "1" }, "linux", "x64").reason,
    /macOS ARM64/u,
  );
  assert.equal(
    nativeLaneGate({ [nativeLaneOptIn]: "true" }, "darwin", "arm64").ok,
    false,
    "only the literal opt-in value unlocks a native lane",
  );
  assert.equal(
    nativeLaneGate({ [nativeLaneOptIn]: "1" }, "darwin", "arm64").ok,
    true,
  );
  assert.throws(() => selectNativeLane([]), /Name one on-demand lane/u);
  assert.throws(
    () => selectNativeLane(["--", "pnpm"]),
    /not an inventoried macOS native lane/u,
  );
  assert.equal(
    selectNativeLane(["--", "headed"]).lane.script,
    "test:desktop:headed",
  );
  assert.deepEqual(selectNativeLane(["api", "--", "extra"]).passthrough, [
    "extra",
  ]);
});

test("hosted CI keeps the portable lane set and its documented native runtime", () => {
  for (const command of ["pnpm check", "pnpm test", "pnpm spec:check"])
    assert.ok(ci.includes(command), `CI must run the portable lane ${command}`);
  assert.match(ci, /LAPIS_DESKTOP_VALIDATION_RUNTIME: native/u);
  assert.match(ci, /runs-on: macos-15/u);
  const selectors = [
    ...walk(resolve(root, "scripts")),
    ".github/workflows/ci.yml",
    "package.json",
  ].filter(
    (path) =>
      /\.(?:mjs|ts|js|json|yml)$/u.test(path) &&
      /LAPIS_DESKTOP_VALIDATION_RUNTIME[^\n]{0,24}native/u.test(read(path)),
  );
  assert.deepEqual(
    selectors.sort(),
    [
      ".github/workflows/ci.yml",
      "scripts/macos-native-lanes.mjs",
      "scripts/validation.mjs",
      // The worker re-selects the runtime for its nested in-container dispatch.
      "scripts/validation/worker.mjs",
    ].sort(),
    "only the runner mechanism, the on-demand dispatcher and hosted CI may select native",
  );
});
