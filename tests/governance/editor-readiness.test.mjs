import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  editorContentsReady,
  editorIsClean,
  waitForEditorContents,
} from "../desktop/editor-readiness.mjs";

test("editor readiness requires the complete expected source before replacement", () => {
  assert.equal(editorContentsReady("", "# Original note\n"), false);
  assert.equal(editorContentsReady("# Original", "# Original note\n"), false);
  assert.equal(
    editorContentsReady("# Draft\n# Original note\n", "# Original note\n"),
    false,
  );
  assert.equal(
    editorContentsReady("# Original note\r\n", "# Original note\n"),
    true,
  );
});

test("editor readiness waits within one bound until exact source is visible", async () => {
  const values = ["", "# Original", "# Original note\n"];
  const editor = { getText: async () => values.shift() };
  let options;
  const browser = {
    async waitUntil(check, received) {
      options = received;
      while (!(await check())) assert.ok(values.length > 0);
    },
  };
  await waitForEditorContents(browser, editor, "# Original note\n");
  assert.deepEqual(options, { timeout: 10_000 });
  assert.deepEqual(values, []);
});

test("clean deletion readiness rejects an absent or dirty editor", async (context) => {
  const reconciliation = readFileSync(
    "tests/desktop/file-reconciliation.test.mjs",
    "utf8",
  );
  assert.match(reconciliation, /editorIsClean\(browser, "Renamed\.md"\)/);
  const previous = globalThis.__lapisPluginAcceptance;
  context.after(() => {
    if (previous === undefined) delete globalThis.__lapisPluginAcceptance;
    else globalThis.__lapisPluginAcceptance = previous;
  });
  let dirty = null;
  globalThis.__lapisPluginAcceptance = { fileDirty: () => dirty };
  const browser = {
    execute(operation, path) {
      return operation(path);
    },
  };
  assert.equal(await editorIsClean(browser, "Renamed.md"), false);
  dirty = true;
  assert.equal(await editorIsClean(browser, "Renamed.md"), false);
  dirty = false;
  assert.equal(await editorIsClean(browser, "Renamed.md"), true);
});
