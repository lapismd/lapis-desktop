import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);

function installedProfileManifest() {
  let directory = dirname(require.resolve("@lapis-notes/app-profile"));
  for (;;) {
    try {
      const value = JSON.parse(readFileSync(join(directory, "package.json")));
      if (value.name === "@lapis-notes/app-profile") return value;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    const parent = dirname(directory);
    assert.notEqual(parent, directory, "installed Profile manifest is present");
    directory = parent;
  }
}

test("installed Profile leaves Vite build tooling with the Desktop host", () => {
  const manifest = installedProfileManifest();
  for (const section of [
    "dependencies",
    "optionalDependencies",
    "peerDependencies",
  ])
    assert.equal(
      manifest[section]?.vite,
      undefined,
      `${section} must not install production Vite`,
    );
  assert.ok(
    manifest.exports["./plugin-host-build"],
    "the public build helper remains exported",
  );
});

test("the retained public Profile build helper imports against host-provided Vite", async () => {
  const helper = await import("@lapis-notes/app-profile/plugin-host-build");
  assert.equal(typeof helper.pluginHostImportMapPlugin, "function");
  const plugin = helper.pluginHostImportMapPlugin();
  assert.equal(typeof plugin.name, "string");
  assert.equal(typeof helper.rendererPluginImportMap.imports, "object");
});
