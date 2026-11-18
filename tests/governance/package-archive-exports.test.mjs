import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { verifyDependencies } from "../../scripts/ci-dependency-artifact.mjs";
import { missingPathPackages } from "../../scripts/ci-prepare-links.mjs";
import {
  buildIdentity,
  inventory,
  digest,
} from "../../scripts/ci-artifact-identity.mjs";

const root = process.cwd();
const put = (root, path, bytes) => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), bytes);
};

test("prepared Profile cannot hide a missing direct Language Service public build", () => {
  const temporary = mkdtempSync(join(tmpdir(), "desktop-public-build-"));
  try {
    const desktop = join(temporary, "lapis-desktop");
    mkdirSync(desktop);
    for (const file of Object.keys(buildIdentity(root).inputs)) {
      mkdirSync(dirname(join(desktop, file)), { recursive: true });
      copyFileSync(join(root, file), join(desktop, file));
    }
    const markers = [
      "../lapis-plugin-tasks/dist/index.js",
      "../lapis-notes/packages/app-profile/dist/index.js",
      "../lapis-ai/packages/ai/dist/index.js",
    ];
    for (const marker of markers) put(desktop, marker, "export {};\n");
    const receipt = {
      identity: buildIdentity(desktop),
      outputs: Object.fromEntries(
        markers.map((marker) => [
          marker,
          inventory(dirname(resolve(desktop, marker))),
        ]),
      ),
    };
    put(desktop, ".local/ci-prepared-links.json", JSON.stringify(receipt));
    const missing = missingPathPackages(desktop);
    assert.deepEqual(
      missing.map((job) => job.marker),
      ["../lapis-notes/packages/language-service/dist/index.js"],
    );
    assert.deepEqual(missing[0].steps.at(-1), [
      "../lapis-notes",
      "pnpm",
      ["--filter", "@lapis-notes/language-service...", "build"],
    ]);
    const marker = missing[0].marker;
    put(desktop, marker, "export {};\n");
    receipt.outputs[marker] = inventory(dirname(resolve(desktop, marker)));
    put(desktop, ".local/ci-prepared-links.json", JSON.stringify(receipt));
    assert.deepEqual(missingPathPackages(desktop), []);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});

test("packed declarations and runtime exports must exist before dependency admission", async () => {
  const { verifyPackageArchive } = await import(
    "../../scripts/package-archive-exports.mjs"
  );
  const temporary = mkdtempSync(join(tmpdir(), "desktop-public-archive-"));
  try {
    const payload = join(temporary, "package");
    mkdirSync(payload);
    put(
      payload,
      "package.json",
      JSON.stringify({
        name: "@lapis-notes/language-service",
        version: "0.1.6",
        types: "./dist/index.d.ts",
        exports: {
          ".": { types: "./dist/index.d.ts", import: "./dist/index.js" },
          "./workers/*": "./dist/workers/*.js",
        },
      }),
    );
    const archive = join(temporary, "package.tgz");
    const pack = () =>
      execFileSync("tar", ["-czf", archive, "-C", temporary, "package"]);
    pack();
    assert.throws(
      () => verifyPackageArchive(archive),
      /missing declared public export.*dist\/index/,
    );
    put(payload, "dist/index.js", "export {};\n");
    put(payload, "dist/index.d.ts", "export {};\n");
    pack();
    assert.throws(
      () => verifyPackageArchive(archive),
      /missing declared public export.*workers/,
    );
    put(payload, "dist/workers/main.js", "export {};\n");
    pack();
    assert.equal(
      verifyPackageArchive(archive).name,
      "@lapis-notes/language-service",
    );
    rmSync(join(payload, "dist/index.js"));
    pack();
    assert.throws(
      () => verifyPackageArchive(archive),
      /missing declared public export.*dist\/index.js/,
    );
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});

test("artifact hash admission also rejects a correctly hashed archive with absent exports", () => {
  const temporary = mkdtempSync(join(tmpdir(), "desktop-incomplete-artifact-"));
  const original = Object.fromEntries(
    ["GITHUB_ACTIONS", "GITHUB_RUN_ID"].map((key) => [key, process.env[key]]),
  );
  try {
    // This is a local controlled fixture, never a hosted artifact/provenance replay.
    delete process.env.GITHUB_ACTIONS;
    delete process.env.GITHUB_RUN_ID;
    const source = JSON.parse(readFileSync("scripts/ci-sources.json")).find(
      (source) => source.name === "lapis-notes",
    );
    put(
      temporary,
      "package/package.json",
      JSON.stringify({
        name: "@lapis-notes/language-service",
        version: "0.1.6",
        exports: { ".": "./dist/index.js" },
      }),
    );
    const pack = () =>
      execFileSync("tar", [
        "-czf",
        join(temporary, "package.tgz"),
        "-C",
        temporary,
        "package",
      ]);
    const writeManifest = () => {
      const bytes = readFileSync(join(temporary, "package.tgz"));
      put(temporary, "package.json", "{}");
      put(temporary, "lock.yaml", "fixture");
      put(
        temporary,
        "manifest.json",
        JSON.stringify({
          schema: 1,
          provenance: null,
          identity: buildIdentity(root),
          entries: [
            {
              role: "dependency",
              name: "@lapis-notes/language-service",
              version: "0.1.6",
              path: "package.tgz",
              size: bytes.length,
              sha256: digest(bytes),
              sourceRepository: source.repository,
              sourceCommit: source.revision,
            },
          ],
          projection: {
            package: {
              path: "package.json",
              sha256: digest(Buffer.from("{}")),
            },
            lock: { path: "lock.yaml", sha256: digest(Buffer.from("fixture")) },
          },
        }),
      );
    };
    pack();
    writeManifest();
    assert.throws(
      () => verifyDependencies(temporary, root),
      /missing declared public export/,
    );
    put(temporary, "package/dist/index.js", "export {};\n");
    pack();
    writeManifest();
    assert.equal(verifyDependencies(temporary, root).length, 1);
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    rmSync(temporary, { recursive: true, force: true });
  }
});
