import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import {
  assertTaskHostModules,
  readTasksArtifact,
} from "../desktop/tasks-installed-assets.mjs";

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "lapis-native-task-assets-"));
  const artifact = join(root, "artifact");
  mkdirSync(artifact);
  const files = {
    "main.mjs": "export default class TaskFixture {}",
    "styles.css": ".task-fixture{}",
    "manifest.json": JSON.stringify({
      id: "tasks",
      version: "0.1.0",
      lapis: {
        runtime: {
          entries: {
            workspace: {
              path: "main.mjs",
              format: "esm",
              sharedDependencies: ["@lapis-notes/api/native-tasks"],
            },
          },
        },
      },
    }),
  };
  const entries = Object.entries(files).map(([path, value]) => {
    writeFileSync(join(artifact, path), value);
    return {
      path,
      size: Buffer.byteLength(value),
      sha256: createHash("sha256").update(value).digest("hex"),
    };
  });
  writeFileSync(
    join(root, "provenance.json"),
    JSON.stringify({
      schema: 1,
      package: {
        name: "@lapis-notes/lapis-plugin-tasks",
        version: "0.1.0",
        sha256: "ab".repeat(32),
      },
      files: entries,
    }),
  );
  return { root, artifact };
}

test("native fixture reads only unchanged hash-verified artifact resources", () => {
  const f = fixture();
  const value = readTasksArtifact(f.artifact);
  assert.equal(value.version, "0.1.0");
  assert.deepEqual(Object.keys(value.files).sort(), [
    "main.mjs",
    "manifest.json",
    "styles.css",
  ]);
});

test("native fixture refuses tampered or missing installed resources before signing", () => {
  const f = fixture();
  writeFileSync(join(f.artifact, "main.mjs"), "changed");
  assert.throws(() => readTasksArtifact(f.artifact), /hash|size|changed/i);
});

test("native fixture refuses redirected resources", () => {
  const f = fixture();
  symlinkSync(join(f.artifact, "main.mjs"), join(f.artifact, "redirect.mjs"));
  assert.throws(
    () => readTasksArtifact(f.artifact),
    /symbolic|resource|unexpected/i,
  );
});

test("native Tasks requires its actual public port and every declared host module", () => {
  assert.doesNotThrow(() =>
    assertTaskHostModules(["@lapis-notes/api/native-tasks"], {
      "@lapis-notes/api/native-tasks": "/public.js",
    }),
  );
  assert.throws(
    () =>
      assertTaskHostModules(["@lapis-notes/api"], {
        "@lapis-notes/api": "/public.js",
      }),
    /native.*port/i,
  );
  assert.throws(
    () =>
      assertTaskHostModules(
        ["@lapis-notes/api/native-tasks", "foreign/module"],
        { "@lapis-notes/api/native-tasks": "/public.js" },
      ),
    /unavailable host module/i,
  );
});
