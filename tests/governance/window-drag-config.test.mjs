import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (name) =>
  JSON.parse(
    readFileSync(new URL(`../../src-tauri/${name}`, import.meta.url), "utf8"),
  );
const ordinary = read("tauri.conf.json");

for (const [profile, windows] of [
  ["ordinary", ordinary.app.windows],
  [
    "acceptance",
    read("tauri.e2e.conf.json").app.windows ?? ordinary.app.windows,
  ],
]) {
  test(`${profile} workspace windows preserve HTML drag-and-drop`, () => {
    assert.ok(windows.length > 0);
    for (const window of windows) {
      assert.equal(
        window.dragDropEnabled,
        false,
        `${window.label}: Tauri's native file-drop handler must not consume workspace tab drops`,
      );
    }
  });
}
