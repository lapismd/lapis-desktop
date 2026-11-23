import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { test } from "node:test";
import { parse, stringify } from "yaml";
import {
  verifyArtifactProjection,
  projectionSourceInputs,
} from "../../scripts/dependency-automation/artifact-projection.mjs";
import { intakeVcsFixture } from "./intake-vcs-fixture.mjs";
import { rmSync } from "node:fs";

const descriptorBytes = readFileSync(
  new URL(
    "../../.github/dependency-automation/artifact-projection.json",
    import.meta.url,
  ),
  "utf8",
);
const files = Object.fromEntries(
  projectionSourceInputs.map((p) => [
    p,
    readFileSync(new URL("../../" + p, import.meta.url), "utf8"),
  ]),
);
const patch = JSON.parse(
  gunzipSync(
    readFileSync(
      new URL("../fixtures/desktop-validator-intake.json.gz", import.meta.url),
    ),
  ),
);
const input = () => ({ files: structuredClone(files), descriptorBytes });
const edit = (d, path, change, yaml = false) => {
  const value = yaml ? parse(d.files[path]) : JSON.parse(d.files[path]);
  change(value);
  d.files[path] = yaml ? stringify(value) : JSON.stringify(value);
};
for (const version of ["before", "after"])
  test("independent shape accepts real SDK patch " + version, () => {
    const d = input();
    d.files = {
      ...d.files,
      ...patch[version],
      ...Object.fromEntries(
        Object.entries(patch.sourceContext).filter(([p]) =>
          projectionSourceInputs.includes(p),
        ),
      ),
    };
    d.descriptorBytes =
      patch.sourceContext[
        ".github/dependency-automation/artifact-projection.json"
      ];
    const result = verifyArtifactProjection(d);
    assert.equal(
      result.shapeSha256,
      "d8fa74cb4f137b2af96a530d7e37afbe4ce082e720802023a47196f0d1f0fbc2",
    );
  });
test("frozen current no-op matches reviewed shared shape and exact descriptor bytes", () => {
  const d = input(),
    before = structuredClone(d);
  assert.deepEqual(verifyArtifactProjection(d), {
    shapeSha256: JSON.parse(descriptorBytes).immutableShapeSha256,
    descriptorSha256: createHash("sha256")
      .update(descriptorBytes)
      .digest("hex"),
    reviewedSource: "c4b54f932cd4239d9a8f0b3e1fb327f28b63dfb2",
  });
  assert.deepEqual(d, before);
});
for (const [name, change] of [
  [
    "application release version",
    (d) => edit(d, "package.json", (x) => (x.version = "2026.31.6-rc.99")),
  ],
  [
    "version orchestration command",
    (d) =>
      edit(
        d,
        "package.json",
        (x) => (x.scripts["release:version"] = "node unreviewed.mjs"),
      ),
  ],
  [
    "private runtime range",
    (d) =>
      edit(
        d,
        "package.json",
        (x) => (x.dependencies[Object.keys(x.dependencies)[0]] = "^99.0.0"),
      ),
  ],
  [
    "private inventory raw bytes",
    (d) => (d.files["scripts/ci-sources.json"] += "\n"),
  ],
  [
    "private inventory BOM",
    (d) =>
      (d.files["scripts/ci-sources.json"] =
        "\ufeff" + d.files["scripts/ci-sources.json"]),
  ],
  [
    "nested docs SDK raw bytes",
    (d) => (d.files[".github/ci-docs/package.json"] += "\n"),
  ],
  [
    "runtime lock importer",
    (d) =>
      edit(
        d,
        "pnpm-lock.yaml",
        (x) =>
          (x.importers["."].dependencies[
            Object.keys(x.importers["."].dependencies)[0]
          ].version = "99.0.0"),
        true,
      ),
  ],
  [
    "shared jiti integrity",
    (d) =>
      edit(
        d,
        "pnpm-lock.yaml",
        (x) =>
          (x.packages["jiti@2.7.0"].resolution.integrity =
            "sha512-" + Buffer.alloc(64, 3).toString("base64")),
        true,
      ),
  ],
  [
    "shared TypeScript snapshot",
    (d) =>
      edit(
        d,
        "pnpm-lock.yaml",
        (x) => (x.snapshots["typescript@5.9.3"].unrelated = "changed"),
        true,
      ),
  ],
  [
    "SDK package metadata",
    (d) =>
      edit(
        d,
        "pnpm-lock.yaml",
        (x) =>
          (x.packages["@lapismd/spec-validator@0.2.1"].engines.node = ">=23"),
        true,
      ),
  ],
  [
    "SDK transitive closure",
    (d) =>
      edit(
        d,
        "pnpm-lock.yaml",
        (x) =>
          (x.snapshots["@lapismd/spec-validator@0.2.1"].dependencies.jiti =
            "2.8.0"),
        true,
      ),
  ],
  [
    "arbitrary peer label",
    (d) =>
      edit(
        d,
        "pnpm-lock.yaml",
        (x) => {
          const key = Object.keys(x.snapshots).find((k) =>
            /\([a-f0-9]{32}\)/.test(k),
          );
          assert.ok(key);
          x.snapshots[
            key.replace(
              /\([a-f0-9]{32}\)/,
              "(0123456789abcdef0123456789abcdef)",
            )
          ] = x.snapshots[key];
          delete x.snapshots[key];
        },
        true,
      ),
  ],
  [
    "SDK runtime scope",
    (d) =>
      edit(
        d,
        "package.json",
        (x) => (x.dependencies["@lapismd/spec-validator"] = "0.2.1"),
      ),
  ],
  [
    "SDK override removal",
    (d) =>
      edit(
        d,
        "pnpm-workspace.yaml",
        (x) => delete x.overrides["@lapismd/spec-validator"],
        true,
      ),
  ],
  [
    "new workspace hook policy",
    (d) =>
      edit(
        d,
        "pnpm-workspace.yaml",
        (x) => (x.hooks = { readPackage: "untrusted" }),
        true,
      ),
  ],
  [
    "duplicate manifest key",
    (d) =>
      (d.files["package.json"] = d.files["package.json"].replace(
        "{",
        '{"private":false,',
      )),
  ],
  [
    "oversized input",
    (d) =>
      (d.files["scripts/ci-sources.json"] = "x".repeat(2 * 1024 * 1024 + 1)),
  ],
  ["missing input", (d) => delete d.files[".github/ci-docs/package.json"]],
  [
    "descriptor command",
    (d) => {
      const x = JSON.parse(d.descriptorBytes);
      x.command = "untrusted";
      d.descriptorBytes = JSON.stringify(x);
    },
  ],
  [
    "descriptor duplicate key",
    (d) =>
      (d.descriptorBytes = d.descriptorBytes.replace(
        "{",
        '{"schemaVersion":2,',
      )),
  ],
  [
    "descriptor wrong repository",
    (d) =>
      (d.descriptorBytes = d.descriptorBytes.replace(
        "lapismd/lapis-desktop",
        "lapismd/other",
      )),
  ],
  ["descriptor null", (d) => (d.descriptorBytes = "null")],
  ["descriptor oversized", (d) => (d.descriptorBytes += " ".repeat(8192))],
])
  test("independent projection rejects " + name, () => {
    const d = input();
    change(d);
    const before = structuredClone(d);
    assert.throws(() => verifyArtifactProjection(d));
    assert.deepEqual(d, before);
  });
test("normal owning CLI rejects private source drift even without another SDK patch", () => {
  const f = intakeVcsFixture({ mode: "jj-selected" });
  try {
    f.jj(["new", f.head, "-m", "Private data drift without SDK change"]);
    f.write(
      ".github/ci-docs/package.json",
      files[".github/ci-docs/package.json"] + "\n",
    );
    assert.notEqual(f.cli().status, 0);
  } finally {
    rmSync(f.directory, { recursive: true, force: true });
  }
});
