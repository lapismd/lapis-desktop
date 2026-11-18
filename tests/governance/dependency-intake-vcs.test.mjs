import assert from "node:assert/strict";
import { rmSync } from "node:fs";
import { test } from "node:test";
import { sourceIntakeReader } from "../../scripts/dependency-automation/source-intake-reader.mjs";
import { intakeVcsFixture, notePath } from "./intake-vcs-fixture.mjs";

for (const mode of [
  "git",
  "jj-selected",
  "jj-bootstrap",
  "jj-working",
  "jj-internal",
]) {
  test(
    "actual CLI verifies SDK patch and discovers its note in " + mode,
    () => {
      const f = intakeVcsFixture({ mode });
      try {
        const result = f.cli();
        assert.equal(result.status, 0, result.stderr);
        const reader = sourceIntakeReader(f.root, undefined, undefined, {});
        assert.ok(
          reader.changedFiles().includes(notePath),
          "candidate note must be inspected",
        );
        assert.equal(reader.sourceSha, f.base);
        assert.equal(reader.headSha, f.head);
        assert.equal(
          JSON.parse(reader("package.json")).devDependencies[
            "@lapismd/spec-validator"
          ],
          "0.2.0",
        );
      } finally {
        rmSync(f.directory, { recursive: true, force: true });
      }
    },
  );
}
for (const mode of ["git", "jj-selected", "jj-bootstrap"])
  for (const [name, options] of [
    ["unrelated committed source", { extra: true }],
    ["malformed note", { note: "not frontmatter" }],
    [
      "runtime release intent",
      { note: '---\n"@lapismd/lapis-desktop": patch\n---\n\nBody\n' },
    ],
    ["oversized note", { note: "---\n---\n\n" + "x".repeat(8192) }],
    ["explicit null note", { note: "---\nnull\n---\n\nBody\n" }],
  ])
    test("actual " + mode + " CLI rejects " + name, () => {
      const f = intakeVcsFixture({ ...options, mode });
      try {
        assert.notEqual(
          f.cli().status,
          0,
          name + " must not disappear from candidate scope",
        );
      } finally {
        rmSync(f.directory, { recursive: true, force: true });
      }
    });
for (const mode of ["git", "jj-selected", "jj-bootstrap"])
  test("actual CLI honors one hosted revision pair in " + mode, () => {
    const f = intakeVcsFixture({ mode });
    try {
      assert.equal(
        f.cli({ LAPIS_DESKTOP_BASE: f.base, LAPIS_DESKTOP_HEAD: f.head })
          .status,
        0,
      );
      for (const env of [
        { LAPIS_DESKTOP_BASE: f.base },
        { LAPIS_DESKTOP_BASE: "a".repeat(40), LAPIS_DESKTOP_HEAD: f.head },
        { LAPIS_DESKTOP_BASE: f.base, LAPIS_DESKTOP_HEAD: f.base },
        { LAPIS_DESKTOP_BASE: f.head, LAPIS_DESKTOP_HEAD: f.base },
      ])
        assert.notEqual(
          f.cli(env).status,
          0,
          "missing/stale ancestry must reject",
        );
    } finally {
      rmSync(f.directory, { recursive: true, force: true });
    }
  });

for (const mode of ["git", "jj-selected", "jj-bootstrap"])
  test(
    "candidate source cannot silently change after selection in " + mode,
    () => {
      const f = intakeVcsFixture({ mode });
      try {
        f.write("src/unrelated.ts", "export const newlyChanged = true;\n");
        if (mode === "git") f.write("package.json", "{}\n");
        assert.notEqual(
          f.cli({ LAPIS_DESKTOP_BASE: f.base, LAPIS_DESKTOP_HEAD: f.head })
            .status,
          0,
        );
      } finally {
        rmSync(f.directory, { recursive: true, force: true });
      }
    },
  );
