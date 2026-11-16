import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
  readFileSync,
} from "node:fs";
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

function mergeFixture(context) {
  const f = fixture(context, ["src/retired.ts"]);
  const base = f.jj("log", "-r", "@-", "--no-graph", "-T", "commit_id").trim();
  const original = JSON.parse(
    readFileSync(join(f.root, "spec/src/history/E-TEST-001.md"), "utf8")
      .split("```json\n")[1]
      .split("\n```")[0],
  );
  const heads = [];
  for (const [side, id] of [
    ["left", "E-TEST-002"],
    ["right", "E-TEST-003"],
  ]) {
    f.jj("new", base, "-m", `Independent ${side} work`);
    f.write(`src/${side}.ts`, `export const ${side} = true;\n`);
    const record = { ...original, id, files: [`src/${side}.ts`] };
    f.write(
      `spec/src/history/${id}.md`,
      "# Receipt\n\n```json\n" + JSON.stringify(record, null, 2) + "\n```\n",
    );
    f.jj("commit", "-m", `Qualify ${side}`);
    heads.push(f.jj("log", "-r", "@-", "--no-graph", "-T", "commit_id").trim());
  }
  f.jj("new", ...heads, "-m", "Merge independently qualified work");
  return f;
}

function mergedFindings(f) {
  // Match the validation runner's exact input snapshot before read-only queries.
  f.jj("status");
  const previous = process.env.LAPIS_DESKTOP_HEAD;
  delete process.env.LAPIS_DESKTOP_HEAD;
  try {
    return evidenceFindings(f.root, { base: "@-" }).errors;
  } finally {
    if (previous === undefined) delete process.env.LAPIS_DESKTOP_HEAD;
    else process.env.LAPIS_DESKTOP_HEAD = previous;
  }
}

test("JJ merges retain independently qualified receipts from every parent", (context) => {
  assert.deepEqual(mergedFindings(mergeFixture(context)), []);
});

test("a merge cannot rewrite a historical receipt from either parent", (context) => {
  const f = mergeFixture(context);
  for (const id of ["E-TEST-002", "E-TEST-003"]) {
    const path = `spec/src/history/${id}.md`;
    const original = readFileSync(join(f.root, path), "utf8");
    f.write(
      path,
      original.replace(
        "Retained original acceptance",
        "Forged replacement acceptance",
      ),
    );
    assert.ok(
      mergedFindings(f).some((error) =>
        error.includes(`${path}: committed evidence is immutable`),
      ),
    );
    f.write(path, original);
  }
});

test("inherited receipts cannot cover new changes made after a merge", (context) => {
  const f = mergeFixture(context);
  f.write("src/right.ts", "export const right = 'new unqualified work';\n");
  assert.ok(
    mergedFindings(f).includes("src/right.ts: no fresh evidence coverage."),
  );
});
