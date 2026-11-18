import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { test } from "node:test";
import { parse, stringify } from "yaml";
import {
  validatorFacts,
  verifyValidatorCanonicalIntake,
} from "../../scripts/dependency-automation/check-canonical-intake.mjs";
import { qualityCommands } from "../../scripts/ci/commands.mjs";
import { sourceIntakeReader } from "../../scripts/dependency-automation/source-intake-reader.mjs";
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
const document = (facts) =>
  "# Source\n\n<!-- dependency-intake:validator-development:start -->\n\n```json\n" +
  JSON.stringify(facts, null, 2) +
  "\n```\n\n<!-- dependency-intake:validator-development:end -->\n";
function input() {
  const before = structuredClone(fixture.before),
    files = structuredClone(fixture.after);
  return {
    before,
    files,
    policyBytes,
    basePolicyBytes: policyBytes,
    changedFiles: [...Object.keys(files), ...chapters],
    baseDocuments: Object.fromEntries(
      chapters.map((p) => [p, document(validatorFacts(before, policyBytes))]),
    ),
    documents: Object.fromEntries(
      chapters.map((p) => [p, document(validatorFacts(files, policyBytes))]),
    ),
  };
}
test("actual released validator patch pair is independently verified", () =>
  assert.equal(verifyValidatorCanonicalIntake(input()).version, "0.2.1"));
for (const [name, mutate] of [
  [
    "stale facts",
    (d) => (d.documents[chapters[0]] = d.baseDocuments[chapters[0]]),
  ],
  ["missing facts", (d) => (d.documents[chapters[0]] = "none")],
  [
    "duplicate markers",
    (d) => (d.documents[chapters[0]] += d.documents[chapters[0]]),
  ],
  ["manual chapter edits", (d) => (d.documents[chapters[0]] += "Manual text")],
  ["changed policy", (d) => (d.basePolicyBytes += " ")],
  ["unexpected source", (d) => d.changedFiles.push("src/index.ts")],
  [
    "unrelated lock drift",
    (d) => (d.files["pnpm-lock.yaml"] += "\nunknownSetting: changed\n"),
  ],
  [
    "public contract drift",
    (d) => {
      const m = JSON.parse(d.files["package.json"]);
      m.peerDependencies = { ...(m.peerDependencies ?? {}), react: "^20" };
      d.files["package.json"] = JSON.stringify(m);
    },
  ],
  [
    "forged integrity",
    (d) =>
      (d.files["pnpm-lock.yaml"] = d.files["pnpm-lock.yaml"].replace(
        validatorFacts(d.files, d.policyBytes).integrity,
        "sha512-" + Buffer.alloc(64, 3).toString("base64"),
      )),
  ],
  [
    "unrelated same-version dependency edge",
    (d) => {
      const lock = parse(d.files["pnpm-lock.yaml"]);
      const [key, row] = Object.entries(lock.snapshots).find(
        ([k, r]) =>
          !k.startsWith("@lapismd/spec-validator@") &&
          r.dependencies &&
          Object.keys(r.dependencies).length,
      );
      const key2 = Object.keys(row.dependencies)[0];
      lock.snapshots[key].dependencies[key2] += "(unreviewed@1.0.0)";
      d.files["pnpm-lock.yaml"] = stringify(lock);
    },
  ],
])
  test("rejects " + name + " without mutation", () => {
    const d = input();
    mutate(d);
    const saved = structuredClone(d);
    assert.throws(() => verifyValidatorCanonicalIntake(d));
    assert.deepEqual(d, saved);
  });
test("source reader fails on unavailable ancestry", () =>
  assert.throws(() => sourceIntakeReader("/source", () => "", false)));

test("accepts one actual empty managed maintenance note without release intent", () => {
  const d = input();
  const path = ".changeset/lapis-dependencies-f235813775ce.md";
  d.files[path] =
    "---\n---\n\nRefresh first-party Lapis dependencies to the published versions recorded in this pull request.\n";
  d.changedFiles.push(path);
  assert.equal(verifyValidatorCanonicalIntake(d).version, "0.2.1");
});
for (const [name, paths, text] of [
  [
    "nonempty release intent",
    [".changeset/lapis-dependencies-f235813775ce.md"],
    '---\n"@lapismd/lapis-desktop": patch\n---\n',
  ],
  [
    "explicit null header",
    [".changeset/lapis-dependencies-f235813775ce.md"],
    "---\nnull\n---\n",
  ],
  [
    "malformed frontmatter",
    [".changeset/lapis-dependencies-f235813775ce.md"],
    "not a Changeset",
  ],
  [
    "multiple maintenance notes",
    [
      ".changeset/lapis-dependencies-f235813775ce.md",
      ".changeset/lapis-dependencies-123456789abc.md",
    ],
    "---\n---\n",
  ],
  ["arbitrary maintenance path", [".changeset/manual.md"], "---\n---\n"],
  [
    "missing managed note",
    [".changeset/lapis-dependencies-f235813775ce.md"],
    undefined,
  ],
])
  test("rejects " + name, () => {
    const d = input();
    for (const path of paths) {
      d.changedFiles.push(path);
      if (text !== undefined) d.files[path] = text;
    }
    const saved = structuredClone(d);
    assert.throws(() => verifyValidatorCanonicalIntake(d));
    assert.deepEqual(d, saved);
  });

for (const [name, text] of [
  ["empty explicit map", "---\n{}\n---\n\nDependency maintenance.\n"],
  ["blank header", "---\n---\n\nDependency maintenance.\n"],
])
  test("accepts " + name, () => {
    const d = input(),
      path = ".changeset/lapis-dependencies-f235813775ce.md";
    d.files[path] = text;
    d.changedFiles.push(path);
    assert.equal(verifyValidatorCanonicalIntake(d).version, "0.2.1");
  });
for (const [name, text] of [
  ["oversized note", "---\n---\n\n" + "x".repeat(8192)],
  ["missing body", "---\n{}\n---\n"],
  ["array release map", "---\n[]\n---\n\nBody\n"],
  ["null release map with body", "---\nnull\n---\n\nBody\n"],
  [
    "nonempty release map with body",
    '---\n"@lapismd/lapis-desktop": patch\n---\n\nBody\n',
  ],
  ["malformed release map with body", "---\n[\n---\n\nBody\n"],
])
  test("rejects " + name, () => {
    const d = input(),
      path = ".changeset/lapis-dependencies-f235813775ce.md";
    d.files[path] = text;
    d.changedFiles.push(path);
    assert.throws(() => verifyValidatorCanonicalIntake(d));
  });
test("ordinary and exempt specification checks retain the independent functional gate", () => {
  const lanes = JSON.parse(
    readFileSync(
      new URL("../../scripts/validation/lanes.json", import.meta.url),
      "utf8",
    ),
  );
  const spec = readFileSync(
    new URL("../../spec-validator.config.mjs", import.meta.url),
    "utf8",
  );
  const guard = "scripts/dependency-automation/check-canonical-intake.mjs";
  assert.ok(lanes.check.startsWith("node " + guard + " && "));
  assert.ok(
    qualityCommands({ LAPIS_CI_QUALITY_GROUPS: "[]" }).some(
      ([command, args]) =>
        command === process.execPath && args.length === 1 && args[0] === guard,
    ),
  );
  assert.ok(spec.includes('args: ["' + guard + '"]'));
});
