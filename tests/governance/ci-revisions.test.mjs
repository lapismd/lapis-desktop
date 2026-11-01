import { test } from "node:test";
import assert from "node:assert/strict";
import { ciSelection } from "../../scripts/ci-revisions.mjs";
import { readFileSync } from "node:fs";

const head = "b".repeat(40),
  base = "a".repeat(40);
test("CI checks the PR base or push range rather than an empty Jujutsu checkout change", () => {
  assert.deepEqual(
    ciSelection({ pull_request: { base: { sha: base } } }, head),
    { base, head },
  );
  assert.deepEqual(ciSelection({ before: base }, head), { base, head });
  assert.deepEqual(ciSelection({ before: "0".repeat(40) }, head), {
    base: "root()",
    head,
  });
  assert.throws(() => ciSelection({ before: "invalid" }, head), /valid base/u);
});

test("every hosted receipt-validation job fetches ancestry and selects the real range", () => {
  const workflow = readFileSync(".github/workflows/ci.yml", "utf8");
  for (const job of ["governance", "quality", "unit"]) {
    const block = workflow
      .split(`\n  ${job}:\n`)[1]
      ?.split(/\n  [a-z][a-z-]*:\n/u)[0];
    assert.ok(block, `${job} exists`);
    assert.match(
      block,
      /uses: actions\/checkout@v6\n\s+with:\n\s+fetch-depth: 0/u,
    );
    assert.match(block, /run: node scripts\/ci-revisions\.mjs/u);
  }
});
