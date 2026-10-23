import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import {
  readArchiveManifest,
  archiveHookSource,
  preserveDependencyFiles,
} from "../../scripts/local-archives.mjs";
import * as archives from "../../scripts/local-archives.mjs";

function fixture(context) {
  const root = mkdtempSync(join(tmpdir(), "lapis-archives-"));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "package"));
  const entry = {
    name: "@lapis-notes/api",
    version: "0.1.4",
    tarball: "api.tgz",
    source: { repository: "lapis-notes", revision: "a".repeat(40) },
  };
  writeFileSync(
    join(root, "package/package.json"),
    JSON.stringify({ name: entry.name, version: entry.version }),
  );
  execFileSync("tar", [
    "-czf",
    join(root, entry.tarball),
    "-C",
    root,
    "package",
  ]);
  entry.sha256 = createHash("sha256")
    .update(readFileSync(join(root, entry.tarball)))
    .digest("hex");
  const manifest = join(root, "manifest.json");
  const save = () =>
    writeFileSync(manifest, JSON.stringify({ version: 1, packages: [entry] }));
  save();
  return { root, entry, manifest, save };
}
test("local archive verification rejects tampering, wrong identities and missing source revisions", (context) => {
  const data = fixture(context);
  assert.equal(readArchiveManifest(data.manifest)[0].name, data.entry.name);
  writeFileSync(join(data.root, "api.tgz"), "altered");
  assert.throws(() => readArchiveManifest(data.manifest), /checksum/u);
  const other = fixture(context);
  other.entry.name = "@lapis-notes/workspace";
  other.save();
  assert.throws(() => readArchiveManifest(other.manifest), /package name/u);
  other.entry.source.revision = "";
  other.save();
  assert.throws(() => readArchiveManifest(other.manifest));
});
test("archive overlays redirect transitive dependencies, retain peer ranges and reject incompatible archives", (context) => {
  const { root, manifest } = fixture(context);
  const hook = join(root, "hook.cjs");
  writeFileSync(hook, archiveHookSource(readArchiveManifest(manifest)));
  const { hooks } = createRequire(import.meta.url)(hook);
  const result = hooks.readPackage({
    dependencies: { "@lapis-notes/api": "^0.1.3", svelte: "5.56.10" },
    peerDependencies: { "@lapis-notes/api": "^0.1.0" },
  });
  assert.match(result.dependencies["@lapis-notes/api"], /^file:/u);
  assert.equal(result.dependencies.svelte, "5.56.10");
  assert.equal(result.peerDependencies["@lapis-notes/api"], "^0.1.0");
  assert.throws(
    () => hooks.readPackage({ dependencies: { "@lapis-notes/api": "^0.2.0" } }),
    /does not satisfy/u,
  );
});
test("failed local installs restore both registry dependency files byte for byte", async (context) => {
  const { root } = fixture(context);
  for (const file of ["package.json", "pnpm-lock.yaml"])
    writeFileSync(join(root, file), file + "\n");
  await assert.rejects(
    preserveDependencyFiles(root, async () => {
      writeFileSync(join(root, "package.json"), "mutated");
      writeFileSync(join(root, "pnpm-lock.yaml"), "local archive lock");
      throw new Error("simulated pnpm install failure");
    }),
    /simulated/u,
  );
  assert.equal(
    readFileSync(join(root, "package.json"), "utf8"),
    "package.json\n",
  );
  assert.equal(
    readFileSync(join(root, "pnpm-lock.yaml"), "utf8"),
    "pnpm-lock.yaml\n",
  );
});

test("archive rewriting is idempotent only for the exact verified dependency path", (context) => {
  const { root, manifest } = fixture(context);
  const hook = join(root, "repeat-hook.cjs");
  writeFileSync(hook, archiveHookSource(readArchiveManifest(manifest)));
  const { hooks } = createRequire(import.meta.url)(hook);
  const pkg = {
    dependencies: { "@lapis-notes/api": "^0.1.4" },
    peerDependencies: { "@lapis-notes/api": "^0.1.4" },
  };
  const once = hooks.readPackage(pkg);
  const expected = once.dependencies["@lapis-notes/api"];
  assert.equal(
    hooks.readPackage(once).dependencies["@lapis-notes/api"],
    expected,
  );
  assert.equal(pkg.peerDependencies["@lapis-notes/api"], "^0.1.4");
  for (const field of ["dependencies", "peerDependencies"])
    assert.throws(
      () =>
        hooks.readPackage({
          [field]: {
            "@lapis-notes/api": `file:${join(root, "unverified.tgz")}`,
          },
        }),
      /does not satisfy/u,
    );
  assert.throws(
    () =>
      hooks.readPackage({ peerDependencies: { "@lapis-notes/api": expected } }),
    /does not satisfy/u,
  );
});

test("peer-only workspace consumers receive the verified archive as an install-only dependency", (context) => {
  const { root, manifest } = fixture(context);
  const hook = join(root, "peer-hook.cjs");
  writeFileSync(hook, archiveHookSource(readArchiveManifest(manifest)));
  const { hooks } = createRequire(import.meta.url)(hook);
  const pkg = hooks.readPackage({
    peerDependencies: { "@lapis-notes/api": "^0.1.2" },
  });
  assert.equal(
    pkg.dependencies?.["@lapis-notes/api"],
    `file:${join(root, "api.tgz")}`,
  );
  assert.equal(pkg.peerDependencies["@lapis-notes/api"], "^0.1.2");
});

test("installation rejects a workspace peer that resolves a second registry API identity", (context) => {
  const { root, manifest } = fixture(context);
  const [entry] = readArchiveManifest(manifest);
  const verified = join(
    root,
    "node_modules/.pnpm/api@file+fixture+api.tgz_peer-one/node_modules/@lapis-notes/api",
  );
  const registry = join(
    root,
    "node_modules/.pnpm/api@0.1.4/node_modules/@lapis-notes/api",
  );
  for (const directory of [verified, registry]) {
    mkdirSync(directory, { recursive: true });
    writeFileSync(
      join(directory, "package.json"),
      JSON.stringify({ name: entry.name, version: entry.version }),
    );
  }
  mkdirSync(join(root, "node_modules/@lapis-notes"), { recursive: true });
  symlinkSync(verified, join(root, "node_modules/@lapis-notes/api"));
  mkdirSync(join(verified, "node_modules/.bin"), { recursive: true });
  writeFileSync(
    join(verified, "node_modules/.bin/generated"),
    "pnpm-generated command shim",
  );
  const workspace = join(root, "packages/fixture");
  mkdirSync(join(workspace, "node_modules/@lapis-notes"), { recursive: true });
  writeFileSync(
    join(workspace, "package.json"),
    JSON.stringify({ peerDependencies: { "@lapis-notes/api": "^0.1.2" } }),
  );
  const peer = join(workspace, "node_modules/@lapis-notes/api");
  symlinkSync(registry, peer);
  assert.throws(
    () => archives.verifyArchiveResolution(root, [entry], [root, workspace]),
    /identity|archive/i,
  );
  rmSync(peer);
  symlinkSync(verified, peer);
  assert.equal(
    archives.verifyArchiveResolution(root, [entry], [root, workspace]),
    2,
  );
  const peerContext = join(
    root,
    "node_modules/.pnpm/api@file+fixture+api.tgz_peer-two/node_modules/@lapis-notes/api",
  );
  mkdirSync(peerContext, { recursive: true });
  writeFileSync(
    join(peerContext, "package.json"),
    readFileSync(join(verified, "package.json")),
  );
  rmSync(peer);
  symlinkSync(peerContext, peer);
  assert.equal(
    archives.verifyArchiveResolution(root, [entry], [root, workspace]),
    2,
  );
  const unverified = join(
    root,
    "node_modules/.pnpm/api@file+unverified+api.tgz_peer-two/node_modules/@lapis-notes/api",
  );
  mkdirSync(unverified, { recursive: true });
  rmSync(peer);
  symlinkSync(unverified, peer);
  assert.throws(
    () => archives.verifyArchiveResolution(root, [entry], [root, workspace]),
    /identity/,
  );
});

test("local built dependencies resolve for transitive shared screen imports without registry fallback", (context) => {
  const { root, manifest } = fixture(context);
  const hook = join(root, "linked-hook.cjs");
  const link = {
    name: "@lapismd/jj-history",
    version: "0.1.0",
    target: "link:/verified/jj-history",
    declared: "link:../jj-store/packages/jj-history",
  };
  writeFileSync(
    hook,
    archiveHookSource(readArchiveManifest(manifest), ["desktop"], [link]),
  );
  const { hooks } = createRequire(import.meta.url)(hook);
  assert.equal(
    hooks.readPackage({
      name: "repository-ui",
      dependencies: { "@lapismd/jj-history": "^0.1.0" },
    }).dependencies[link.name],
    link.target,
  );
  assert.equal(
    hooks.readPackage({
      name: "desktop",
      dependencies: { [link.name]: link.declared },
    }).dependencies[link.name],
    link.target,
  );
  assert.throws(
    () =>
      hooks.readPackage({
        name: "repository-ui",
        dependencies: { [link.name]: "^0.2.0" },
      }),
    /does not satisfy/u,
  );
  assert.throws(
    () =>
      hooks.readPackage({
        name: "repository-ui",
        dependencies: { [link.name]: link.declared },
      }),
    /does not satisfy/u,
  );
});
