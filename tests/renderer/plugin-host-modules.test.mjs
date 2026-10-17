import { test } from "node:test";
import assert from "node:assert/strict";
import {
  pluginHostInputs,
  pluginImportMap,
  pluginHostModules,
} from "../../scripts/plugin-host-modules.ts";

test("portable import map publishes API, Markdown, editor and exact renderer contracts", () => {
  const imports = pluginImportMap.imports;
  for (const specifier of [
    "@lapis-notes/api",
    "@lapis-notes/api/workspace-host",
    "@lapis-notes/markdown/embed",
    "@codemirror/state",
    "svelte/renderer/5.56.10/internal/client",
  ])
    assert.ok(imports[specifier], specifier);
  assert.equal(
    Object.keys(imports).some(
      (specifier) =>
        specifier.startsWith("node:") ||
        specifier === "electron" ||
        specifier.includes("/private/"),
    ),
    false,
  );
  assert.equal(
    new Set(Object.values(imports)).size,
    Object.keys(imports).length,
  );
  assert.equal(
    Object.keys(pluginHostInputs).length,
    Object.keys(imports).length,
  );
});

test("build-owned bridge entries re-export public modules and ignore unknown routes", () => {
  const plugin = pluginHostModules();
  const id = plugin.resolveId(pluginImportMap.imports["@lapis-notes/api"]);
  assert.match(plugin.load(id), /^export \* from "@lapis-notes\/api";/);
  assert.equal(plugin.resolveId("file:///etc/passwd"), undefined);
  assert.equal(plugin.load("node:fs"), undefined);
  const html = plugin.transformIndexHtml();
  assert.equal(html[0].attrs.type, "importmap");
  assert.deepEqual(JSON.parse(html[0].children), pluginImportMap);
});
