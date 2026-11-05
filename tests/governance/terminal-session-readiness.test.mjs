import { test } from "node:test";
import assert from "node:assert/strict";
import {
  absentTerminalAdmission,
  readExistingTerminalSessions,
  waitForNewTerminalSession,
} from "../desktop/terminal-session-readiness.mjs";

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

test("an unadmitted Terminal list is an empty baseline and other errors still fail", async () => {
  const admitted = new Error(
    "WebDriverError: Terminal is disabled or no vault is admitted",
  );
  assert.equal(absentTerminalAdmission(admitted), true);
  assert.deepEqual(
    await readExistingTerminalSessions(async () => {
      throw admitted;
    }),
    [],
  );
  assert.deepEqual(
    await readExistingTerminalSessions(async () => [{ id: "retained" }]),
    [{ id: "retained" }],
  );
  await assert.rejects(
    readExistingTerminalSessions(async () => {
      throw new Error("Terminal admission unavailable");
    }),
    /Terminal admission unavailable/u,
  );
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
