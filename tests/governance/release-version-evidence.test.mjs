import test from "node:test";
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
import { versionEvidence } from "../../scripts/release/version-evidence.mjs";

function fixture(
  t,
  intent = "Preview intent: awaiting its reviewed version PR.",
) {
  const root = mkdtempSync(join(tmpdir(), "desktop-version-history-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const part of ["history", "current", "navigation"])
    mkdirSync(join(root, "spec/src", part), { recursive: true });
  const historical =
    "Release `2026.31.6-rc.2` retains candidate qualification in [E-CLI-007](../history/E-CLI-007.md).\n";
  writeFileSync(
    join(root, "spec/src/current/desktop.md"),
    `${intent}\n\n${historical}`,
  );
  writeFileSync(
    join(root, "spec/src/current/governance.md"),
    "[Intent](distribution.md).\n",
  );
  writeFileSync(join(root, "spec/src/navigation/history-01.md"), "");
  const prepare = (previousVersion, version) =>
    versionEvidence(
      {
        previousVersion,
        version,
        changesets: ["reviewed-note"],
      },
      root,
    );
  return {
    root,
    historical,
    prepare,
    read: (p) => readFileSync(join(root, p), "utf8"),
  };
}

test("preview version intent preserves earlier qualification and remains pending across releases", (t) => {
  const f = fixture(t);
  f.prepare("2026.31.6-rc.2", "2026.31.6-rc.3");
  assert.ok(f.read("spec/src/current/desktop.md").endsWith(f.historical));
  assert.match(
    f.read("spec/src/current/desktop.md"),
    /Preview intent: \[2026\.31\.6-rc\.3\]\(\.\.\/history\/E-RELEASE-001\.md\) \(pending\)\./,
  );
  f.prepare("2026.31.6-rc.3", "2026.31.6-rc.4");
  assert.ok(f.read("spec/src/current/desktop.md").endsWith(f.historical));
  assert.match(
    f.read("spec/src/current/desktop.md"),
    /\[2026\.31\.6-rc\.4\]\(\.\.\/history\/E-RELEASE-002\.md\) \(pending\)\./,
  );
  for (const id of ["001", "002"]) {
    const receipt = f.read(`spec/src/history/E-RELEASE-${id}.md`);
    assert.match(receipt, /"result": "pending"/);
    assert.match(
      receipt,
      /Full exact-source CI and candidate\/native installation qualification/,
    );
  }
});

test("missing or ambiguous version-intent anchors fail before rewriting qualification", (t) => {
  for (const intent of [
    "No intent anchor",
    "Preview intent: awaiting its reviewed version PR.\n\nPreview intent: awaiting its reviewed version PR.",
    "Preview intent: awaiting its reviewed version PR. Historical qualification remains rc.2.",
  ]) {
    const f = fixture(t, intent);
    const before = f.read("spec/src/current/desktop.md");
    assert.throws(
      () => f.prepare("2026.31.6-rc.2", "2026.31.6-rc.3"),
      /version intent anchor/,
    );
    assert.equal(f.read("spec/src/current/desktop.md"), before);
  }
});
