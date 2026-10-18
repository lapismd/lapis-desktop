import test from "node:test";
import assert from "node:assert/strict";
import { operationCommandLabel } from "../../src/lib/repository/operation-command.ts";

test("JJ recorded nested TOML quotes render as readable command arguments", () => {
  const recorded = String.raw`jj --no-pager --config 'user.name=\'History fixture\'' --config 'user.email=\'fixture@invalid\'' new -m 'Native working revision'`;
  assert.equal(
    operationCommandLabel(recorded),
    `jj --no-pager --config "user.name='History fixture'" --config "user.email='fixture@invalid'" new -m 'Native working revision'`,
  );
});

test("simple commands and unrecognized formats preserve the recorded text", () => {
  for (const recorded of [
    "",
    "jj describe -r @ -m 'A readable message'",
    `git commit -m 'title'`,
    `jj describe -m "shell quoting"`,
    "jj 'unfinished",
    "jj 'value'extra",
    "jj 'ends with slash\\'",
    "jj\nnew",
  ])
    assert.equal(operationCommandLabel(recorded), recorded);
});

test("literal apostrophes and shell syntax remain safely quoted display text", () => {
  assert.equal(
    operationCommandLabel(String.raw`jj describe -m 'Alice\'s note'`),
    `jj describe -m "Alice's note"`,
  );
  assert.equal(
    operationCommandLabel(
      String.raw`jj describe -m 'Alice\'s $HOME and $(echo hi)'`,
    ),
    String.raw`jj describe -m 'Alice'\''s $HOME and $(echo hi)'`,
  );
  assert.equal(
    operationCommandLabel(String.raw`jj describe -m 'C:\notes\file.md'`),
    String.raw`jj describe -m 'C:\notes\file.md'`,
  );
});
