import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

test("plugin fixture sources select retired-free Plugins without changing native sources", () => {
  const sources = JSON.parse(readFileSync("scripts/ci-sources.json", "utf8"));
  assert.equal(
    sources.find(({ name }) => name === "lapis-plugins").revision,
    "969356250f26c5561fac22cf00d8da8f395dbdae",
  );
  assert.equal(
    sources.find(({ name }) => name === "lapis-ai").revision,
    "9a98293c26524c9320acdd9767e34e8ffdd7170c",
  );
  assert.equal(
    sources.find(({ name }) => name === "lapis-plugin-tasks").revision,
    "7e25dc5cce821baca7831827f1711c1f18cbabf1",
  );
});

test("both artifact producers audit the actual Plugins checkout before dependency/build work", () => {
  const native = readFileSync("scripts/ci-native-fixtures.mjs", "utf8");
  const local = readFileSync("scripts/local-macos-build.mjs", "utf8");
  const checked = native.indexOf("assertRetiredFreePlugins(plugins)");
  assert.ok(
    checked > 0 && checked < native.indexOf('["install", "--frozen-lockfile"]'),
  );
  assert.ok(checked < native.indexOf("scripts/plugin-release.mjs"));
  const build = local.slice(local.indexOf("function installPlugins()"));
  assert.ok(build.indexOf("assertRetiredFreePlugins(pluginsRepo)") > 0);
  assert.ok(
    build.indexOf("assertRetiredFreePlugins(pluginsRepo)") <
      build.indexOf('["plugin:build"]'),
  );
});

test("source-owned retirement audit rejects stale, missing and failing sources before continuing", async () => {
  const { assertRetiredFreePlugins } = await import(
    "../../scripts/plugin-source-admission.mjs"
  );
  const source = mkdtempSync(join(tmpdir(), "desktop-plugin-admission-"));
  try {
    mkdirSync(join(source, "scripts"));
    const guard = join(source, "scripts/check-retired-ai.mjs");
    let continued = false;
    assert.throws(() => {
      assertRetiredFreePlugins(source);
      continued = true;
    });
    assert.equal(continued, false);
    writeFileSync(
      guard,
      'import { existsSync } from "node:fs"; if (existsSync("packages/ai")) process.exit(37);\n',
    );
    mkdirSync(join(source, "packages/ai"), { recursive: true });
    assert.throws(
      () => {
        assertRetiredFreePlugins(source);
        continued = true;
      },
      ({ status }) => status === 37,
    );
    assert.equal(continued, false);
    rmSync(join(source, "packages/ai"), { recursive: true });
    assertRetiredFreePlugins(source);
    writeFileSync(guard, 'throw new Error("audit failed");\n');
    assert.throws(
      () => assertRetiredFreePlugins(source),
      ({ status }) => status === 1,
    );
  } finally {
    rmSync(source, { recursive: true, force: true });
  }
});
