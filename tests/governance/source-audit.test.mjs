import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ambientApp,
  auditSources,
  auditManifest,
  countedLines,
} from "../../scripts/source-audit.mjs";

test("ambient App audit rejects direct, optional, bracket, alias and reflection access", () => {
  for (const source of [
    "globalThis.app",
    "globalThis?.app",
    'globalThis["app"]',
    "window.app",
    "const root = globalThis; const alias = root; alias.app",
    'Reflect.get(globalThis, "app")',
    "const { app } = globalThis",
  ])
    assert.equal(ambientApp(source), true, source);
  assert.equal(ambientApp("const app = props.app;"), false);
});
test("source budgets count CSS universal selectors and reject oversized files", () => {
  assert.equal(
    countedLines("/* comment */\n\n// comment\n* { color: red; }"),
    1,
  );
  assert.equal(
    auditSources(["src/large.ts"], () => "const n = 1;\n".repeat(301))[0].code,
    "LD-SOURCE-SIZE",
  );
});
test("production cannot import fixtures or use Deno and utility styles", () => {
  for (const source of [
    "import x from '../tests/fixture.ts'",
    "Deno.readTextFile('x')",
    '<div class="flex gap-2">',
  ]) {
    assert.ok(
      auditSources(["src/example.svelte"], () => source).length,
      source,
    );
  }
});
test("package and permission audits reject source links, broad native grants and automation", () => {
  const config = {
    app: {
      withGlobalTauri: true,
      security: { capabilities: ["main", "acceptance"] },
    },
  };
  const findings = auditManifest(
    { dependencies: { package: "file:../package" } },
    { windows: ["*"], permissions: ["core:default"] },
    config,
  );
  assert.equal(findings.length, 3);
});

test("desktop integration retains exact local grants and rejects additional plugin authority", () => {
  const manifest = JSON.parse(readFileSync("package.json", "utf8"));
  const capabilities = JSON.parse(
    readFileSync("src-tauri/capabilities/main.json", "utf8"),
  );
  const configuration = JSON.parse(
    readFileSync("src-tauri/tauri.conf.json", "utf8"),
  );
  assert.deepEqual(auditManifest(manifest, capabilities, configuration), []);
  for (const permission of [
    "opener:default",
    "clipboard-manager:default",
    "core:default",
  ]) {
    const broad = {
      ...capabilities,
      permissions: [...capabilities.permissions, permission],
    };
    assert.ok(
      auditManifest(manifest, broad, configuration).some(
        (finding) => finding.code === "LD-CAPABILITY-SCOPE",
      ),
    );
  }
});
