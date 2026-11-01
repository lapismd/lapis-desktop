import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { evidenceFileCorrections } from "../../scripts/evidence-corrections.mjs";

const text = "immutable earlier receipt";
const old = { id: "E-OLD-001", path: "old.md", files: ["deleted.ts"] };
const correction = {
  record: old.id,
  sha256: createHash("sha256").update(text).digest("hex"),
  deletionRevision: "a".repeat(40),
  files: ["deleted.ts"],
};
const options = () => ({
  committed: new Set([old.path]),
  read: () => text,
  enclosing: () => "b".repeat(40),
  isAncestor: () => true,
  deletedFiles: () => new Set(["deleted.ts"]),
});
const records = (value = correction) => [
  old,
  {
    id: "E-NEW-001",
    path: "new.md",
    historicalFileCorrections: [value],
  },
];

test("forward correction proves an unchanged receipt's earlier deletion", () => {
  const actual = evidenceFileCorrections(records(), options());
  assert.deepEqual([...actual.get(old.path)], ["deleted.ts"]);
});

test("correction rejects changed bytes and uncommitted targets", () => {
  assert.throws(
    () =>
      evidenceFileCorrections(records(), {
        ...options(),
        read: () => "rewritten receipt",
      }),
    /receipt bytes/u,
  );
  assert.throws(
    () =>
      evidenceFileCorrections(records(), {
        ...options(),
        committed: new Set(),
      }),
    /committed receipt/u,
  );
});

test("unrelated revisions, invented files and non-deletions fail closed", () => {
  assert.throws(
    () =>
      evidenceFileCorrections(records(), {
        ...options(),
        isAncestor: () => false,
      }),
    /ancestor/u,
  );
  assert.throws(
    () =>
      evidenceFileCorrections(
        records({
          ...correction,
          files: ["unrelated.ts"],
        }),
        options(),
      ),
    /named deletion/u,
  );
  assert.throws(
    () =>
      evidenceFileCorrections(records(), {
        ...options(),
        deletedFiles: () => new Set(),
      }),
    /named deletion/u,
  );
});

test("malformed or duplicate corrections cannot grant historical paths", () => {
  for (const value of [
    null,
    { ...correction, deletionRevision: "main" },
    { ...correction, files: [] },
    { ...correction, record: "unknown" },
  ]) {
    assert.throws(() => evidenceFileCorrections(records(value), options()));
  }
  const duplicated = records();
  duplicated[1].historicalFileCorrections.push(correction);
  assert.throws(
    () => evidenceFileCorrections(duplicated, options()),
    /Duplicate/u,
  );
});

test("real Jujutsu deletion and rename provenance resolves delayed receipts", async () => {
  const { mkdtemp, mkdir, writeFile, readFile, rename, rm } = await import(
    "node:fs/promises"
  );
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { execFileSync } = await import("node:child_process");
  const { evidenceFindings } = await import("../../scripts/evidence.mjs");
  const root = await mkdtemp(join(tmpdir(), "lapis-evidence-provenance-"));
  const jj = (...args) =>
    execFileSync(
      "jj",
      [
        "--no-pager",
        "--config",
        'user.name="Evidence test"',
        "--config",
        'user.email="test@localhost"',
        "--config",
        'signing.behavior="drop"',
        ...args,
      ],
      { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    ).trim();
  const metadata = (id, files) => ({
    id,
    revision: "enclosing-change",
    result: "pending",
    requirements: ["LD-GOV-003"],
    files,
    versions: { node: "24" },
    contractReview: "Historical files remain verifiable.",
    acceptanceReview: "Tooling fixture only.",
    runs: [],
    remaining: [],
  });
  const receipt = (entry) => "```json\n" + JSON.stringify(entry) + "\n```\n";
  try {
    jj("git", "init", "--colocate", root);
    for (const path of [
      "spec/src/current",
      "spec/src/history",
      "spec/evidence",
    ])
      await mkdir(join(root, path), { recursive: true });
    await writeFile(
      join(root, "spec/src/current/governance.md"),
      "| LD-GOV-003 | Immutable evidence |\n",
    );
    await writeFile(
      join(root, "spec/evidence/legacy-validation-receipts.json"),
      "[]",
    );
    await writeFile(join(root, "deleted.ts"), "removed source");
    await writeFile(join(root, "moved.md"), "retained source");
    jj("commit", "-m", "Initial source");
    await rm(join(root, "deleted.ts"));
    await rename(join(root, "moved.md"), join(root, "retained.md"));
    jj("commit", "-m", "Delete and move source");
    const deletionRevision = jj(
      "log",
      "--no-graph",
      "-r",
      "@-",
      "-T",
      "commit_id",
    );
    await writeFile(join(root, "later.md"), "Unrelated later change");
    jj("commit", "-m", "Later source snapshot");
    const target = "spec/src/history/E-OLD-001.md";
    await writeFile(
      join(root, target),
      receipt(metadata("E-OLD-001", ["deleted.ts", "moved.md"])),
    );
    jj("commit", "-m", "Delayed immutable receipt");
    assert.equal(
      evidenceFindings(root, { checkRevision: false }).errors.length,
      2,
    );
    const current = metadata("E-NEW-001", []);
    current.historicalFileCorrections = [
      {
        record: "E-OLD-001",
        deletionRevision,
        sha256: createHash("sha256")
          .update(await readFile(join(root, target)))
          .digest("hex"),
        files: ["deleted.ts", "moved.md"],
      },
    ];
    const correctionPath = join(root, "spec/src/history/E-NEW-001.md");
    await writeFile(correctionPath, receipt(current));
    assert.deepEqual(
      evidenceFindings(root, { checkRevision: false }).errors,
      [],
    );
    current.historicalFileCorrections[0].deletionRevision = jj(
      "log",
      "--no-graph",
      "-r",
      `${deletionRevision}-`,
      "-T",
      "commit_id",
    );
    await writeFile(correctionPath, receipt(current));
    assert.throws(
      () => evidenceFindings(root, { checkRevision: false }),
      /named deletion/u,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
