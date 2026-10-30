import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseEvidence,
  validateEvidence,
  revisionErrors,
} from "../../scripts/evidence-model.mjs";

const path = "spec/src/history/E-SPEC-001.md";
const record = () => ({
  id: "E-SPEC-001",
  path,
  result: "pass",
  requirements: ["LD-GOV-004"],
  files: ["deleted.md"],
  revision: "candidate",
  versions: { node: "24" },
  contractReview: "The owning contract is updated.",
  acceptanceReview:
    "Original acceptance remains separate from this tooling proof.",
  runs: [
    { command: "node --test", name: "regression", result: "pass", failures: 0 },
  ],
  remaining: [],
});
const requirements = new Set(["LD-GOV-004"]);

test("new requirement evidence needs no migration task or milestone metadata", () => {
  assert.deepEqual(validateEvidence([record()], requirements), []);
  assert.equal(parseEvidence('```json\n{"id":"example"}\n```').id, "example");
  assert.throws(() => parseEvidence("no metadata"), /exactly one/u);
});

test("legacy review metadata is accepted only for committed historical records", () => {
  const old = record();
  delete old.acceptanceReview;
  old.milestoneReview = "Original task gate retained at the recorded revision.";
  assert.deepEqual(validateEvidence([old], requirements, new Set([path])), []);
  assert.match(validateEvidence([old], requirements).join("\n"), /reviews/u);
});

test("false passes, unknown requirements and duplicate identities fail closed", () => {
  const failed = record();
  failed.runs[0].failures = 1;
  failed.remaining = ["native proof"];
  failed.requirements.push("LD-UNKNOWN-001");
  const errors = validateEvidence([failed, record()], requirements).join("\n");
  assert.match(errors, /invalid run result/u);
  assert.match(errors, /no gaps/u);
  assert.match(errors, /unknown requirement/u);
  assert.match(errors, /Duplicate evidence/u);
  failed.runs = [];
  failed.remaining = [];
  assert.match(
    validateEvidence([failed], requirements).join("\n"),
    /passing run/u,
  );
  failed.requirements = [];
  assert.match(
    validateEvidence([failed], requirements).join("\n"),
    /owning requirement/u,
  );
});

test("modified and deleted committed receipts are rejected", () => {
  const previous = new Map([[path, "original"]]);
  for (const current of [new Map(), new Map([[path, "modified"]])])
    assert.match(
      revisionErrors([], current, previous, []).join("\n"),
      /immutable/u,
    );
});

test("fresh receipts cover real deletions and missing coverage rejects", () => {
  const previous = new Map([["deleted.md", null]]);
  assert.deepEqual(
    revisionErrors([record()], new Map(), previous, [path, "deleted.md"]),
    [],
  );
  assert.match(
    revisionErrors([record()], new Map(), previous, [path, "other.md"]).join(
      "\n",
    ),
    /no fresh evidence/u,
  );
  previous.set(path, "original");
  assert.match(
    revisionErrors([record()], new Map([[path, "original"]]), previous, [
      "deleted.md",
    ]).join("\n"),
    /no fresh evidence/u,
  );
});
