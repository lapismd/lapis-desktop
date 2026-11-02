import { test } from "node:test";
import assert from "node:assert/strict";
import { rendererReadiness } from "../desktop/native-readiness.mjs";

test("native readiness retains a receipt split across output chunks", () => {
  const receipt = rendererReadiness();
  assert.equal(receipt(Buffer.from("lapis-desktop: rend")), false);
  assert.equal(receipt(Buffer.from("erer ready\n")), true);
  assert.equal(receipt(Buffer.from("later output")), true);
});

test("native readiness finds a receipt before a large output tail", () => {
  const receipt = rendererReadiness();
  assert.equal(receipt(Buffer.from("almost ready\n")), false);
  assert.equal(
    receipt(Buffer.from("lapis-desktop: renderer ready\n" + "x".repeat(4096))),
    true,
  );
});

import { EventEmitter } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import { waitForNativeReadiness } from "../desktop/native-readiness.mjs";

function processFixture() {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.exitCode = null;
  child.signalCode = null;
  return child;
}
function cleaned(child) {
  for (const event of ["error", "exit"])
    assert.equal(child.listenerCount(event), 0);
  assert.equal(child.stdout.listenerCount("data"), 0);
}

test("renderer marker latches before listener readiness completes", async () => {
  const child = processFixture();
  let listening;
  const wait = waitForNativeReadiness(
    child,
    () =>
      new Promise((resolve) => {
        listening = resolve;
      }),
  );
  child.stdout.emit("data", Buffer.from("lapis-desktop: rend"));
  child.stdout.emit("data", Buffer.from("erer ready\n"));
  listening(true);
  await wait;
  cleaned(child);
});

test("confirmed listener waits for the renderer without polling status again", async () => {
  const child = processFixture();
  let requests = 0;
  const phases = [];
  const wait = waitForNativeReadiness(
    child,
    async () => {
      requests++;
      return true;
    },
    {
      timeout: 1000,
      interval: 1,
      onPhase: (phase) => phases.push(phase),
    },
  );
  await delay(30);
  assert.equal(requests, 1);
  child.stdout.emit("data", Buffer.from("lapis-desktop: renderer ready\n"));
  await wait;
  assert.deepEqual(phases, ["listening", "renderer"]);
  cleaned(child);
});

test("unsuccessful listener responses are paced and do not reset the deadline", async () => {
  const child = processFixture();
  let requests = 0;
  await assert.rejects(
    waitForNativeReadiness(
      child,
      async () => {
        requests++;
        return false;
      },
      {
        timeout: 40,
        interval: 100,
      },
    ),
    /deadline exhausted while awaiting listener/u,
  );
  assert.equal(requests, 1);
  cleaned(child);
});

test("socket readiness without renderer acknowledgement exhausts the same budget", async () => {
  const child = processFixture();
  let requestSignal;
  await assert.rejects(
    waitForNativeReadiness(
      child,
      async (signal) => {
        requestSignal = signal;
        return true;
      },
      {
        timeout: 30,
      },
    ),
    /renderer acknowledgement/u,
  );
  assert.equal(requestSignal.aborted, true);
  cleaned(child);
});

for (const [event, args, expected] of [
  ["exit", [1, null], /code=1, signal=null/u],
  ["exit", [null, "SIGTERM"], /signal=SIGTERM/u],
  ["error", [new Error("spawn failed")], /Native process failed/u],
])
  test(`startup rejects ${event} ${args[1] ?? args[0]} and removes listeners`, async () => {
    const child = processFixture();
    const wait = waitForNativeReadiness(child, async () => true);
    child.emit(event, ...args);
    await assert.rejects(wait, expected);
    cleaned(child);
  });

test("cancellation interrupts an in-flight status request and removes listeners", async () => {
  const child = processFixture();
  const cancellation = new AbortController();
  let requestSignal;
  const wait = waitForNativeReadiness(
    child,
    (signal) => {
      requestSignal = signal;
      return new Promise(() => {});
    },
    { signal: cancellation.signal },
  );
  cancellation.abort(new Error("cancelled by caller"));
  await assert.rejects(wait, /cancelled by caller/u);
  assert.equal(requestSignal.aborted, true);
  cleaned(child);
});

test("already-exited processes and pre-cancelled starts cannot report readiness", async () => {
  const child = processFixture();
  child.signalCode = "SIGKILL";
  await assert.rejects(
    waitForNativeReadiness(child, async () => true),
    /SIGKILL/u,
  );
  cleaned(child);
  const cancellation = new AbortController();
  cancellation.abort(new Error("cancelled before startup"));
  await assert.rejects(
    waitForNativeReadiness(processFixture(), async () => true, {
      signal: cancellation.signal,
    }),
    /cancelled before startup/u,
  );
});
