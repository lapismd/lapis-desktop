import { test } from "node:test";
import assert from "node:assert/strict";
import { runFocusedHistory } from "../../src/lib/desktop/desktop-integration.ts";

class Keyboard extends Event {
  constructor(type, options) {
    super(type, options);
    this.key = options.key;
    this.metaKey = options.metaKey;
    this.ctrlKey = options.ctrlKey;
    this.shiftKey = options.shiftKey;
  }
}
function fixture() {
  const native = [];
  const target = new EventTarget();
  const document = {
    activeElement: target,
    defaultView: { KeyboardEvent: Keyboard },
    execCommand: (command) => native.push(command),
  };
  return { document, target, native };
}
test("native history actions enter the focused editor keymap without also applying DOM undo", () => {
  const { document, target, native } = fixture();
  let value = "edited";
  target.addEventListener("keydown", (event) => {
    if (event.key === "z" && event.metaKey) {
      value = event.shiftKey ? "edited" : "original";
      event.preventDefault();
    }
  });
  runFocusedHistory(document, "undo", true);
  assert.equal(value, "original");
  runFocusedHistory(document, "redo", true);
  assert.equal(value, "edited");
  assert.deepEqual(native, []);
});
test("ordinary inputs retain DOM history and missing focus cannot edit another owner", () => {
  const { document, native } = fixture();
  runFocusedHistory(document, "undo", false);
  runFocusedHistory(document, "redo", false);
  assert.deepEqual(native, ["undo", "redo"]);
  document.activeElement = null;
  runFocusedHistory(document, "undo", true);
  assert.deepEqual(native, ["undo", "redo"]);
});
