import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, sep } from "node:path";
import { archiveHookSource } from "../../scripts/archive-hook.mjs";

const require = createRequire(import.meta.url);
const packages = ["fixture-api", "fixture-consumer"];
function writeHook(root) {
  const hook = join(root, ".local/ci-packages/pnpmfile.cjs");
  const entries = packages.map((name) => ({
    name,
    version: "1.0.0",
    tarball: join(root, `.local/ci-packages/${name}/package.tgz`),
    declared: `file:.local/ci-packages/${name}/package.tgz`,
  }));
  const semver = join(root, ".local/ci-package-tools/node_modules/semver");
  writeFileSync(
    hook,
    archiveHookSource(
      entries,
      ["frozen-fixture-app"],
      [],
      semver,
      dirname(hook),
    ),
  );
  return hook;
}
function prepare(root) {
  mkdirSync(root, { recursive: true });
  for (const name of packages) {
    const directory = join(root, "packed", "package");
    rmSync(directory, { recursive: true, force: true });
    mkdirSync(directory, { recursive: true });
    const pkg = { name, version: "1.0.0", main: "index.cjs" };
    if (name === "fixture-consumer") {
      pkg.dependencies = { "fixture-api": "^1.0.0" };
      pkg.peerDependencies = { "fixture-api": "^1.0.0" };
    }
    writeFileSync(join(directory, "package.json"), JSON.stringify(pkg));
    writeFileSync(
      join(directory, "index.cjs"),
      name === "fixture-api"
        ? 'module.exports = { source: "verified-archive-v1" };\n'
        : 'module.exports = require("fixture-api");\n',
    );
    const archive = join(root, `.local/ci-packages/${name}/package.tgz`);
    mkdirSync(dirname(archive), { recursive: true });
    execFileSync("tar", ["-czf", archive, "-C", dirname(directory), "package"]);
  }
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify({
      name: "frozen-fixture-app",
      private: true,
      version: "0.0.0",
      packageManager: "pnpm@10.34.5",
      dependencies: Object.fromEntries(
        packages.map((name) => [name, "^1.0.0"]),
      ),
    }),
  );
  const semver = realpathSync(dirname(require.resolve("semver/package.json")));
  const target = join(root, ".local/ci-package-tools/node_modules/semver");
  mkdirSync(dirname(target), { recursive: true });
  cpSync(semver, target, { recursive: true });
  writeHook(root);
}
function install(root, store, frozen) {
  return spawnSync(
    "pnpm",
    [
      "install",
      "--ignore-workspace",
      "--offline",
      "--ignore-scripts",
      frozen ? "--frozen-lockfile" : "--no-frozen-lockfile",
      `--pnpmfile=${join(root, ".local/ci-packages/pnpmfile.cjs")}`,
      "--store-dir",
      store,
    ],
    {
      cwd: root,
      env: { ...process.env, CI: "true" },
      encoding: "utf8",
      timeout: 30000,
      maxBuffer: 2 * 1024 * 1024,
    },
  );
}

test(
  "frozen archive installation survives checkout relocation without the producer or a second API identity",
  { timeout: 60000 },
  () => {
    const temporary = mkdtempSync(
      join(tmpdir(), "lapis-frozen-archive-relocation-"),
    );
    try {
      const producer = join(temporary, "home", "runner", "producer");
      const consumer = join(
        temporary,
        "container",
        "__w",
        "checkout",
        "consumer",
      );
      const store = join(temporary, "store");
      prepare(producer);
      const produced = install(producer, store, false);
      assert.equal(produced.status, 0, produced.stdout + produced.stderr);
      const lock = readFileSync(join(producer, "pnpm-lock.yaml"), "utf8");
      assert.match(lock, /pnpmfileChecksum:/u);
      const generated = readFileSync(
        join(producer, ".local/ci-packages/pnpmfile.cjs"),
        "utf8",
      );
      const nodeModules = join(producer, "node_modules");
      cpSync(producer, consumer, {
        recursive: true,
        filter: (source) =>
          source !== nodeModules && !source.startsWith(nodeModules + sep),
      });
      writeHook(consumer);
      rmSync(producer, { recursive: true });
      const consumed = install(consumer, store, true);
      assert.equal(consumed.status, 0, consumed.stdout + consumed.stderr);
      assert.equal(
        readFileSync(join(consumer, "pnpm-lock.yaml"), "utf8"),
        lock,
      );
      const imported = createRequire(join(consumer, "package.json"));
      assert.deepEqual(imported("fixture-api"), {
        source: "verified-archive-v1",
      });
      assert.equal(imported("fixture-api"), imported("fixture-consumer"));
      const viaConsumer = createRequire(imported.resolve("fixture-consumer"));
      assert.equal(
        realpathSync(imported.resolve("fixture-api")),
        realpathSync(viaConsumer.resolve("fixture-api")),
      );
    } finally {
      rmSync(temporary, { recursive: true, force: true });
    }
  },
);

test("relocatable archive hooks refuse implicit roots and local source links", () => {
  const entry = {
    name: "fixture-api",
    version: "1.0.0",
    tarball: "/admitted/api.tgz",
  };
  const semver = require.resolve("semver");
  assert.throws(
    () => archiveHookSource([entry], [], [], semver, "relative-root"),
    /absolute inputs/,
  );
  assert.throws(
    () => archiveHookSource([entry], [], [], "semver", "/admitted/hooks"),
    /absolute inputs/,
  );
  assert.throws(
    () =>
      archiveHookSource(
        [{ ...entry, tarball: "relative.tgz" }],
        [],
        [],
        semver,
        "/admitted/hooks",
      ),
    /absolute inputs/,
  );
  assert.throws(
    () =>
      archiveHookSource(
        [entry],
        [],
        [{ name: "source", version: "1.0.0", target: "link:/outside" }],
        semver,
        "/admitted/hooks",
      ),
    /cannot admit local source links/,
  );
});
