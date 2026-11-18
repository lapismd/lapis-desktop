import assert from "node:assert/strict";
import { test } from "node:test";
import {
  readFileSync,
  mkdtempSync,
  mkdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import {
  validatorFacts,
  verifyValidatorCanonicalIntake,
} from "../../scripts/dependency-automation/check-canonical-intake.mjs";
import { loadMaintenanceNotes } from "../../scripts/dependency-automation/maintenance-note.mjs";
const fixture = JSON.parse(
  gunzipSync(
    readFileSync(
      new URL("../fixtures/desktop-validator-intake.json.gz", import.meta.url),
    ),
  ),
);
const policyBytes = readFileSync(
  new URL(
    "../../.github/dependency-automation/canonical-intake.json",
    import.meta.url,
  ),
  "utf8",
);
const { chapters } = JSON.parse(policyBytes);
const path = ".changeset/lapis-dependencies-012345abcdef.md";
function input() {
  const files = structuredClone(fixture.after);
  const doc =
    "<!-- dependency-intake:validator-development:start -->\n```json\n" +
    JSON.stringify(validatorFacts(files, policyBytes)) +
    "\n```\n<!-- dependency-intake:validator-development:end -->";
  return {
    files,
    before: structuredClone(files),
    policyBytes,
    basePolicyBytes: policyBytes,
    documents: Object.fromEntries(chapters.map((p) => [p, doc])),
    changedFiles: [path],
    consumedNotes: [path],
  };
}
test("truly absent consumed note is accepted only for unchanged complete dependency facts", () => {
  const d = input();
  assert.equal(verifyValidatorCanonicalIntake(d).version, "0.2.1");
  d.before = structuredClone(fixture.before);
  assert.throws(() => verifyValidatorCanonicalIntake(d));
});
for (const bytes of [
  "---\nnull\n---\nbody",
  '---\n"runtime": patch\n---\nbody',
  "---\n{\n---\nbody",
  "---\n---\n" + "é".repeat(4096),
])
  test(
    "present invalid note cannot use unchanged-facts return: " +
      bytes.slice(0, 15),
    () => {
      const d = input();
      d.consumedNotes = [];
      d.files[path] = bytes;
      assert.throws(() => verifyValidatorCanonicalIntake(d));
    },
  );
test("missing bytes require explicit absent-path evidence and immutable integrity", () => {
  const d = input();
  d.consumedNotes = [];
  assert.throws(() => verifyValidatorCanonicalIntake(d));
  d.consumedNotes = [path];
  d.before["pnpm-lock.yaml"] = d.before["pnpm-lock.yaml"].replace(
    validatorFacts(d.before, policyBytes).integrity,
    "sha512-" + "A".repeat(86) + "==",
  );
  assert.throws(() => verifyValidatorCanonicalIntake(d));
});
test("missing-only current reader retains raw path and rejects unsafe files", (t) => {
  const root = mkdtempSync(join(tmpdir(), "desktop-note-lifecycle-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, ".changeset"));
  assert.deepEqual(loadMaintenanceNotes(root, [path], {}), [path]);
  symlinkSync(join(root, "missing"), join(root, path));
  assert.throws(() => loadMaintenanceNotes(root, [path], {}));
  rmSync(join(root, path));
  mkdirSync(join(root, path));
  assert.throws(() => loadMaintenanceNotes(root, [path], {}));
  rmSync(join(root, path), { recursive: true });
  writeFileSync(join(root, path), "---\n---\n\nMaintenance.\n");
  const files = {};
  assert.deepEqual(loadMaintenanceNotes(root, [path], files), []);
  assert.equal(typeof files[path], "string");
});
