import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
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
