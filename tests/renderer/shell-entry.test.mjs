import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { loadShell } from "../../src/lib/desktop/load-shell.ts";

test("initial HTML cannot paint a standalone logo before the shared progress surface", () => {
  const html = readFileSync("index.html", "utf8");
  const boot = html.match(/<div id="boot"[^>]*>([\s\S]*?)<\/div>/)?.[1];
  assert.notEqual(boot, undefined);
  assert.equal(
    boot.trim(),
    "",
    "The shared startup component owns the first screen",
  );
});

test("shared progress mounts before the application import and stays until it settles", async () => {
  const events = [];
  let release;
  const pending = new Promise((resolve) => {
    release = resolve;
  });
  const loading = loadShell(
    async () => {
      events.push("progress");
      return {
        close: async () => {
          events.push("finished");
        },
        fail: () => assert.fail(),
      };
    },
    async () => {
      events.push("application import");
      await pending;
    },
  );
  await Promise.resolve();
  assert.deepEqual(events, ["progress", "application import"]);
  release();
  await loading;
  assert.deepEqual(events, ["progress", "application import", "finished"]);
});

test("failed imports retain the existing startup failure surface and exact diagnostic", async () => {
  const failure = new Error("Native handshake unavailable");
  let shown;
  let closed = false;
  await assert.rejects(
    loadShell(
      async () => ({
        close: async () => {
          closed = true;
        },
        fail: (error) => {
          shown = error;
        },
      }),
      async () => {
        throw failure;
      },
    ),
    (error) => error === failure,
  );
  assert.equal(shown, failure);
  assert.equal(closed, false);
});
