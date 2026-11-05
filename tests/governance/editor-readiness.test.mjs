import assert from "node:assert/strict";
import test from "node:test";
import {
  editorContentsReady,
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
