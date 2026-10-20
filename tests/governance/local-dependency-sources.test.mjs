import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  committedSource,
  assertDependencyCompatibility,
  jj,
} from "../../scripts/local-dependency-sources.mjs";
import {
  exportDigest,
  freshness,
} from "../../scripts/refresh-local-dependencies.mjs";

function source(context) {
  const root = mkdtempSync(join(tmpdir(), "lapis-local-source-"));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  jj(root, "git", "init");
  jj(root, "config", "set", "--repo", "user.name", "Source fixture");
  jj(root, "config", "set", "--repo", "user.email", "fixture@example.test");
  mkdirSync(join(root, "packages/client"), { recursive: true });
  writeFileSync(
    join(root, "packages/client/index.ts"),
    "export const value = 1;\n",
  );
  jj(root, "commit", "-m", "Initial public client");
  jj(root, "bookmark", "create", "main", "-r", "@-");
  writeFileSync(
    join(root, "packages/client/index.ts"),
    "export const value = 2;\n",
  );
  jj(root, "commit", "-m", "New client ahead of main");
  return root;
}

test("local source uses committed checkout work ahead of main and preserves named empty integration commits", (context) => {
  const root = source(context);
  assert.equal(
    committedSource(root, ["packages/client"]),
    jj(root, "log", "-r", "@-", "--no-graph", "-T", "commit_id"),
  );
  assert.notEqual(
    committedSource(root, ["packages/client"]),
    jj(root, "log", "-r", "main", "--no-graph", "-T", "commit_id"),
  );
  jj(root, "describe", "-m", "Source integration checkpoint");
  assert.equal(
    committedSource(root, ["packages/client"]),
    jj(root, "log", "-r", "@", "--no-graph", "-T", "commit_id"),
  );
});

test("unrelated docs stay untouched while dirty package or build inputs reject refresh", (context) => {
  const root = source(context);
  writeFileSync(join(root, "README.md"), "Unrelated work\n");
  assert.match(committedSource(root, ["packages/client"]), /^[a-f0-9]{40}$/u);
  writeFileSync(
    join(root, "packages/client/index.ts"),
    "export const value = 3;\n",
  );
  assert.throws(
    () => committedSource(root, ["packages/client"]),
    /Uncommitted package\/build inputs/u,
  );
  jj(root, "restore", "--", "packages/client/index.ts");
  writeFileSync(join(root, "package.json"), "{}\n");
  assert.throws(
    () => committedSource(root, ["packages/client"]),
    /Uncommitted package\/build inputs/u,
  );
  jj(root, "restore", "--", "package.json");
  writeFileSync(join(root, "tsconfig.pack.json"), "{}\n");
  assert.throws(
    () => committedSource(root, ["packages/client"]),
    /Uncommitted package\/build inputs/u,
  );
});

test("freshness rejects old archives and changed linked export bytes even at a matching revision", (context) => {
  const root = mkdtempSync(join(tmpdir(), "lapis-local-exports-"));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "dist"));
  writeFileSync(join(root, "dist/index.js"), "export const value = 1;\n");
  const groups = [
    {
      revision: "new",
      packages: [
        { name: "archive", linked: false },
        { name: "linked", linked: true, root },
      ],
    },
  ];
  const links = [
    {
      name: "linked",
      source: { revision: "new" },
      exports: exportDigest(join(root, "dist")),
    },
  ];
  assert.deepEqual(
    freshness(
      groups,
      [{ name: "archive", source: { revision: "old" } }],
      links,
    ).map((row) => row.current),
    [false, true],
  );
  writeFileSync(join(root, "dist/index.js"), "export const value = 2;\n");
  assert.deepEqual(
    freshness(
      groups,
      [{ name: "archive", source: { revision: "new" } }],
      links,
    ).map((row) => row.current),
    [true, false],
  );
});

test("cohort preflight rejects the original Design Core range before building or stopping review", () => {
  const core = "@lapismd/design-core";
  const manifests = [
    { name: "@lapis-notes/markdown", dependencies: { [core]: "^0.4.0" } },
  ];
  assert.throws(
    () => assertDependencyCompatibility(manifests, new Map([[core, "0.5.1"]])),
    /markdown:.*0\.5\.1 does not satisfy \^0\.4\.0/u,
  );
  manifests[0].dependencies[core] = "^0.4.0 || ^0.5.1";
  for (const version of ["0.4.0", "0.5.1"])
    assert.doesNotThrow(() =>
      assertDependencyCompatibility(manifests, new Map([[core, version]])),
    );
  assert.throws(
    () => assertDependencyCompatibility(manifests, new Map()),
    /Missing local source mapping/u,
  );
  manifests[0].dependencies[core] = "workspace:~";
  assert.doesNotThrow(() =>
    assertDependencyCompatibility(manifests, new Map([[core, "0.5.1"]])),
  );
});
