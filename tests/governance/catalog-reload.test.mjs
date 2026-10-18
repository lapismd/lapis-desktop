import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { createServer } from "vite";
import catalog from "../../vite.catalog.config.ts";
import storybook from "../../.storybook/main.ts";

test("catalog watches source edits without forwarding JJ metadata churn", async (context) => {
  const root = await mkdtemp(resolve(tmpdir(), "lapis-catalog-watch-"));
  await mkdir(resolve(root, ".jj"));
  await mkdir(resolve(root, "src-tauri/target/debug"), { recursive: true });
  const source = resolve(root, "source.css"),
    metadata = resolve(root, ".jj/state");
  await writeFile(source, "body {}\n");
  await writeFile(metadata, "before\n");
  const nativeOutput = resolve(root, "src-tauri/target/debug/artifact");
  await writeFile(nativeOutput, "before\n");
  const events = [];
  // Storybook replaces the Vite file's server block before calling viteFinal.
  const actual = await storybook.viteFinal({ server: { hmr: false } });
  const server = await createServer({
    configFile: false,
    root,
    logLevel: "silent",
    server: { ...actual.server, host: "127.0.0.1", port: 0 },
  });
  context.after(async () => {
    await server.close();
    await rm(root, { recursive: true, force: true });
  });
  server.watcher.on("all", (_event, file) => events.push(file));
  const ready = new Promise((resolveReady) =>
    server.watcher.once("ready", resolveReady),
  );
  await server.listen();
  await ready;
  await writeFile(metadata, "after\n");
  await writeFile(nativeOutput, "after\n");
  await writeFile(source, "body { color: inherit; }\n");
  const deadline = Date.now() + 5000;
  while (!events.includes(source) && Date.now() < deadline)
    await new Promise((resolveTick) => setTimeout(resolveTick, 20));
  assert.ok(events.includes(source), "normal source edits retain live reload");
  assert.equal(
    events.includes(metadata),
    false,
    "JJ metadata cannot rebuild the story dependency graph",
  );
  assert.equal(
    events.includes(nativeOutput),
    false,
    "native builds cannot flood the dependency graph",
  );
});

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
