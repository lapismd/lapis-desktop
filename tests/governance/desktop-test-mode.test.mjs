import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runDesktopTests } from "../../scripts/desktop-tests.mjs";

test("CI retains explicit headed native acceptance when the local default is quiet", () => {
  const workflow = readFileSync(".github/workflows/ci.yml", "utf8");
  assert.match(
    workflow,
    /name: Native ARM64 acceptance\s+run: pnpm test:desktop:headed\n/u,
  );
});

async function commands(args) {
  const calls = [];
  await runDesktopTests(args, async (...values) => calls.push(values));
  return calls;
}

test("default and explicit headless desktop checks never launch the native UI runner", async () => {
  for (const args of [[], ["--headless"], ["--", "--headless"]]) {
    const calls = await commands(args);
    assert.deepEqual(
      calls.map(([command, arguments_]) => [command, arguments_]),
      [
        ["pnpm", ["test"]],
        ["pnpm", ["test:storybook"]],
      ],
    );
  }
});

test("explicit headed mode retains the complete native acceptance runner", async () => {
  const calls = await commands(["--headed"]);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], process.execPath);
  assert.deepEqual(calls[0][1], ["scripts/desktop-acceptance.mjs"]);
  assert.equal(calls[0][2].MACOSX_DEPLOYMENT_TARGET, "13.0");
  assert.equal(calls[0][2].CARGO_BUILD_JOBS, "2");
});

test("invalid or conflicting desktop flags fail before any child starts", async () => {
  for (const args of [
    ["--headless", "--headed"],
    ["--headed", "--headed"],
    ["--headles"],
  ]) {
    let started = false;
    await assert.rejects(
      runDesktopTests(args, async () => {
        started = true;
      }),
      /--headless.*--headed/,
    );
    assert.equal(started, false);
  }
});

test("a failed headless lane stops the run and preserves the failure", async () => {
  let calls = 0;
  const failure = new Error("Native service regression");
  await assert.rejects(
    runDesktopTests([], async () => {
      calls++;
      throw failure;
    }),
    (error) => error === failure,
  );
  assert.equal(calls, 1);
});
