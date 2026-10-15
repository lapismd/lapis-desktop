import { test } from "node:test";
import assert from "node:assert/strict";
import { ciSelection } from "../../scripts/ci-revisions.mjs";

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
