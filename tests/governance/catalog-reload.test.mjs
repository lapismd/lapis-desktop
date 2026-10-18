import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import catalog from "../../vite.catalog.config.ts";

test("catalog reconstructs owned runtime/fixture instances and retains component/style HMR", () => {
  const plugin = catalog.plugins
    .flat(Infinity)
    .find((p) => p.name === "lapis-owned-runtime-reload");
  assert.ok(plugin, "catalog must install its owned-runtime reload plugin");
  assert.equal(plugin.apply, "serve");
  const messages = [];
  const server = { ws: { send: (message) => messages.push(message) } };
  for (const file of [
    "src/lib/repository/history-controller.ts",
    "src/main.ts",
    "catalog/support/repository/fixture.ts",
    "catalog/support/repository/RepositoryDemo.svelte",
  ]) {
    assert.deepEqual(
      plugin.handleHotUpdate({ file: resolve(file), server }),
      [],
    );
    assert.deepEqual(messages.pop(), { type: "full-reload" });
  }
  for (const file of [
    "src/components/repository/RepositoryCommitPicker.svelte",
    "src/components/repository/repository-commit-picker.css",
    "src/vite-env.d.ts",
    "catalog/plugins/repository/History.stories.ts",
    ".local/generated/fixture.ts",
    "storybook-static/assets/fixture.ts",
    "spec/book/fixture.ts",
    "../lapis-notes/src/fixture.ts",
    "../lapis-desktop-history-other/src/fixture.ts",
  ])
    assert.equal(
      plugin.handleHotUpdate({ file: resolve(file), server }),
      undefined,
      file,
    );
  assert.deepEqual(messages, []);
});
