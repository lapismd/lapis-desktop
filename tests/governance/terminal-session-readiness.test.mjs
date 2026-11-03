import { test } from "node:test";
import assert from "node:assert/strict";
import { waitForNewTerminalSession } from "../desktop/terminal-session-readiness.mjs";

test("terminal readiness ignores retained sessions and returns the newly admitted one", async () => {
  const retained = { id: "retained" };
  const opened = { id: "opened" };
  const observations = [[retained], [retained, opened]];
  const browser = {
    async waitUntil(check) {
      while (!(await check())) assert.ok(observations.length > 0);
    },
  };
  const actual = await waitForNewTerminalSession(
    browser,
    async () => observations.shift(),
    [retained],
  );
  assert.equal(actual, opened);
  assert.equal(observations.length, 0);
});

test("one UI request cannot ambiguously admit multiple terminal sessions", async () => {
  const browser = {
    async waitUntil(check) {
      await check();
    },
  };
  await assert.rejects(
    waitForNewTerminalSession(
      browser,
      async () => [{ id: "first" }, { id: "second" }],
      [],
    ),
    /multiple new sessions/u,
  );
});
