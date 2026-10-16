import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalRecovery,
  readRecovery,
  storeRecovery,
  startupFailure,
  startupDiagnostic,
} from "../../src/lib/notes/startup-recovery.ts";
function storage() {
  const data = new Map();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
}
test("recovery restrictions round-trip within one vault session and omit unavailable capabilities", () => {
  const local = storage();
  const state = {
    ...normalRecovery(),
    active: true,
    skipLayoutRestore: true,
    disableOptionalCorePlugins: true,
    disableCommunityPlugins: true,
    disableNotebookExecution: true,
  };
  storeRecovery("first", state, local);
  assert.deepEqual(readRecovery("first", local), {
    ...state,
    disableCommunityPlugins: false,
    disableNotebookExecution: false,
  });
  assert.deepEqual(readRecovery("other", local), normalRecovery());
  storeRecovery("first", normalRecovery(), local);
  assert.equal(local.data.size, 0);
  assert.deepEqual(readRecovery("first", local), normalRecovery());
});
test("corrupt, inactive and unavailable recovery storage fall back to normal startup", () => {
  const local = storage();
  for (const value of [
    "{",
    "false",
    '{"active":false,"skipLayoutRestore":true}',
  ]) {
    local.data.set("lapis.safeMode.session:first", value);
    assert.deepEqual(readRecovery("first", local), normalRecovery());
  }
  const unavailable = {
    getItem() {
      throw new Error("denied");
    },
    setItem() {
      throw new Error("denied");
    },
    removeItem() {
      throw new Error("denied");
    },
  };
  assert.deepEqual(readRecovery("first", unavailable), normalRecovery());
  assert.doesNotThrow(() =>
    storeRecovery("first", { ...normalRecovery(), active: true }, unavailable),
  );
  assert.doesNotThrow(() =>
    storeRecovery("first", normalRecovery(), unavailable),
  );
});
test("diagnostics retain the failed phase and message when WebKit omits it from the stack", () => {
  const error = new Error("Invalid saved layout");
  error.stack = "restoreLayout@tauri://localhost/index.js:12:4";
  const failure = startupFailure("layout", error);
  assert.match(failure.detail, /Invalid saved layout\nrestoreLayout/);
  const diagnostic = JSON.parse(startupDiagnostic("Café", failure));
  assert.equal(diagnostic.phase, "layout");
  assert.equal(diagnostic.vaultName, "Café");
  assert.equal(diagnostic.message, error.message);
  assert.equal(diagnostic.detail, failure.detail);
});
