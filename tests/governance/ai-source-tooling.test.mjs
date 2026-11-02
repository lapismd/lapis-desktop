import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import test from "node:test";
import {
  loadAiBundleVerifier,
  sourceToolingArguments,
} from "../../scripts/ai-source-tooling.mjs";

function sourceFixture(parent = tmpdir()) {
  const source = mkdtempSync(join(parent, "ai-source-tooling-"));
  mkdirSync(join(source, "scripts"));
  writeFileSync(
    join(source, "package.json"),
    JSON.stringify({
      type: "module",
      devDependencies: { "@iarna/toml": "2.2.5" },
    }),
  );
  writeFileSync(join(source, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
  // This controlled module tests dependency resolution, not TOML parser behavior.
  writeFileSync(
    join(source, "scripts/bundle.mjs"),
    'import dependency from "@iarna/toml"; export const verifyBundle = () => dependency.fixtureIdentity;\n',
  );
  return source;
}
function installedFixtureTooling(source, identity = "source-owned-tooling") {
  const dependency = join(source, "node_modules/@iarna/toml");
  mkdirSync(dependency, { recursive: true });
  writeFileSync(
    join(dependency, "package.json"),
    JSON.stringify({ name: "@iarna/toml", main: "index.cjs" }),
  );
  writeFileSync(
    join(dependency, "index.cjs"),
    `module.exports = ${JSON.stringify({ fixtureIdentity: identity })};\n`,
  );
}

test("fresh source tooling precedes verifier import and warm reuse does not reinstall or rebuild exports", async () => {
  const source = sourceFixture();
  try {
    const before = ["package.json", "pnpm-lock.yaml"].map((file) =>
      readFileSync(join(source, file), "utf8"),
    );
    // A separate process proves the real import failure without caching a failed ESM job.
    const missing = spawnSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `await import(${JSON.stringify(pathToFileURL(join(source, "scripts/bundle.mjs")).href)})`,
      ],
      { encoding: "utf8" },
    );
    assert.notEqual(missing.status, 0);
    assert.match(missing.stderr, /ERR_MODULE_NOT_FOUND/);
    let installs = 0;
    const installer = async (cwd, args) => {
      installs++;
      assert.equal(cwd, source);
      assert.deepEqual(args, [
        "install",
        "--frozen-lockfile",
        "--ignore-scripts",
      ]);
      installedFixtureTooling(source);
    };
    const verifier = await loadAiBundleVerifier(source, installer);
    assert.equal(verifier.verifyBundle(), "source-owned-tooling");
    const warm = await loadAiBundleVerifier(source, async () =>
      assert.fail("Warm source tooling must not reinstall"),
    );
    assert.equal(warm.verifyBundle(), "source-owned-tooling");
    assert.equal(installs, 1);
    assert.deepEqual(
      ["package.json", "pnpm-lock.yaml"].map((file) =>
        readFileSync(join(source, file), "utf8"),
      ),
      before,
    );
    assert.deepEqual(sourceToolingArguments, [
      "install",
      "--frozen-lockfile",
      "--ignore-scripts",
    ]);
  } finally {
    rmSync(source, { recursive: true, force: true });
  }
});

test("source tooling installer failure survives instead of importing an unavailable verifier", async () => {
  const source = sourceFixture();
  try {
    const failure = Object.assign(new Error("frozen source install rejected"), {
      exitCode: 37,
    });
    await assert.rejects(
      loadAiBundleVerifier(source, async () => {
        throw failure;
      }),
      (error) => error === failure && error.exitCode === 37,
    );
    await assert.rejects(
      loadAiBundleVerifier(source, async () => {}),
      (error) => error.code === "MODULE_NOT_FOUND",
    );
  } finally {
    rmSync(source, { recursive: true, force: true });
  }
});

test("the real installer preserves a failing pnpm process status", async () => {
  const source = sourceFixture();
  const previousPath = process.env.PATH;
  try {
    const bin = join(source, "bin");
    mkdirSync(bin);
    writeFileSync(join(bin, "pnpm"), "#!/bin/sh\nexit 37\n");
    chmodSync(join(bin, "pnpm"), 0o755);
    process.env.PATH = `${bin}:${previousPath}`;
    await assert.rejects(
      loadAiBundleVerifier(source),
      (error) =>
        error.exitCode === 37 &&
        error.signal === null &&
        /installation exited with 37/.test(error.message),
    );
  } finally {
    process.env.PATH = previousPath;
    rmSync(source, { recursive: true, force: true });
  }
});

test("a parent TOML module cannot replace the source-owned frozen tooling graph", async () => {
  const parent = mkdtempSync(join(tmpdir(), "ai-parent-tooling-"));
  try {
    installedFixtureTooling(parent, "untracked-parent-tooling");
    const source = sourceFixture(parent);
    const require = createRequire(join(source, "scripts/bundle.mjs"));
    assert.ok(
      require.resolve("@iarna/toml").startsWith(join(parent, "node_modules")),
    );
    let installs = 0;
    const verifier = await loadAiBundleVerifier(source, async (cwd, args) => {
      installs++;
      assert.equal(cwd, source);
      assert.deepEqual(args, [
        "install",
        "--frozen-lockfile",
        "--ignore-scripts",
      ]);
      installedFixtureTooling(source);
    });
    assert.equal(installs, 1);
    assert.equal(verifier.verifyBundle(), "source-owned-tooling");
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});
