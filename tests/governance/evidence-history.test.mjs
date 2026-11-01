import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { evidenceFindings } from "../../scripts/evidence.mjs";

function fixture(context, recordedFiles) {
  const root = mkdtempSync(join(tmpdir(), "desktop-evidence-history-"));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  const jj = (...args) =>
    execFileSync(
      "jj",
      [
        "--no-pager",
        "--config",
        "signing.behavior='drop'",
        "--config",
        "user.name='Evidence fixture'",
        "--config",
        "user.email='fixture@invalid'",
        ...args,
      ],
      { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
  const write = (path, content) => writeFileSync(join(root, path), content);
  jj("git", "init", "--colocate", ".");
  for (const path of [
    "src",
    "spec/src/current",
    "spec/src/history",
    "spec/evidence",
  ])
    mkdirSync(join(root, path), { recursive: true });
  write("spec/evidence/legacy-validation-receipts.json", "[]\n");
  write(
    "spec/src/current/governance.md",
    "| LD-GOV-003 | Evidence MUST remain immutable. |\n",
  );
  write("src/retired.ts", "export const retired = true;\n");
  jj("commit", "-m", "Original source");
  rmSync(join(root, "src/retired.ts"));
  jj("commit", "-m", "Remove the retired source");
  write("src/current.ts", "export const current = true;\n");
  jj("commit", "-m", "Independent subsequent work");
  const record = {
    id: "E-TEST-001",
    revision: "enclosing-change",
    result: "pass",
    requirements: ["LD-GOV-003"],
    files: recordedFiles,
    runs: [
      {
        name: "Original boundary",
        command: "fixture",
        result: "pass",
        failures: 0,
      },
    ],
    versions: { fixture: "1" },
    contractReview: "Retained original contract",
    acceptanceReview: "Retained original acceptance",
    remaining: [],
  };
  write(
    "spec/src/history/E-TEST-001.md",
    "# Receipt\n\n```json\n" + JSON.stringify(record, null, 2) + "\n```\n",
  );
  jj("commit", "-m", "Record aggregate acceptance after earlier removal");
  return { root, write, jj };
}

test("inherited aggregate evidence resolves source removed before the receipt's immediate parent", (context) => {
  const f = fixture(context, ["src/retired.ts"]);
  assert.deepEqual(
    evidenceFindings(f.root, { checkRevision: false, base: "@-" }).errors,
    [],
  );
});

test("immutable evidence cannot claim a file introduced only after its enclosing snapshot", (context) => {
  const f = fixture(context, ["src/future.ts"]);
  f.write("src/future.ts", "export const future = true;\n");
  f.jj("commit", "-m", "Later source is outside the receipt's history");
  rmSync(join(f.root, "src/future.ts"));
  f.jj("commit", "-m", "Later source removed again");
  assert.deepEqual(
    evidenceFindings(f.root, { checkRevision: false, base: "@-" }).errors,
    ["E-TEST-001: evidence names missing file src/future.ts."],
  );
});
