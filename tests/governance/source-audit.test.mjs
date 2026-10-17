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
test("native source root contains only crate entrypoints", () => {
  for (const file of [
    "src-tauri/src/commands.rs",
    "src-tauri/src/new_service.rs",
  ])
    assert.ok(
      auditSources([file], () => "").some(
        (finding) => finding.code === "LD-NATIVE-LAYOUT",
      ),
      file,
    );
  assert.deepEqual(
    auditSources(
      [
        "src-tauri/src/main.rs",
        "src-tauri/src/lib.rs",
        "src-tauri/src/host/vault/files.rs",
        "src-tauri/src/vault/resources.rs",
        "src-tauri/src/acceptance/actions.rs",
      ],
      () => "",
    ),
    [],
  );
});
test("production cannot import fixtures or use Deno and utility styles", () => {
  for (const source of [
    "import x from '../tests/fixture.ts'",
    "import x from '../catalog/support/fixture.ts'",
    "Deno.readTextFile('x')",
    '<div class="flex gap-2">',
  ]) {
    assert.ok(
      auditSources(["src/example.svelte"], () => source).length,
      source,
    );
  }
});
test("catalog feature imports stay production-owned while fixture imports reject", () => {
  const file = "src/components/ai/catalog/Panel.svelte";
  for (const source of [
    'import type { Group } from "../../../lib/ai/catalog/types.ts";',
    'export { catalog } from "../../../lib/ai/catalog/inventory.ts";',
    'const catalog = import("../../../lib/ai/catalog/inventory.ts");',
  ])
    assert.deepEqual(
      auditSources([file], () => source),
      [],
      source,
    );
  for (const source of [
    'import { fixture } from "../../../../catalog/support/fixture.ts";',
    'export { fixture } from "../../../../catalog/support/fixture.ts";',
    'const fixture = import("../../../../catalog/support/fixture.ts");',
    'import { fixture } from "../../../lib/ai/fixtures/store.ts";',
    'import { fixture } from "../../../lib/ai/catalog/store.test.ts";',
  ])
    assert.ok(
      auditSources([file], () => source).some(
        (finding) => finding.code === "LD-SOURCE-TEST-IMPORT",
      ),
      source,
    );
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

test("AI session permission stays exact and bound to the admitted main window", () => {
  const manifest = JSON.parse(readFileSync("package.json", "utf8"));
  const capabilities = JSON.parse(
    readFileSync("src-tauri/capabilities/main.json", "utf8"),
  );
  const config = JSON.parse(readFileSync("src-tauri/tauri.conf.json", "utf8"));
  assert.deepEqual(
    capabilities.permissions.filter((permission) =>
      permission.startsWith("lapis-ai:"),
    ),
    ["lapis-ai:acp-session"],
  );
  const admitted = {
    ...capabilities,
    permissions: [
      ...new Set([
        ...capabilities.permissions,
        "allow-desktop-ai-admit",
        "allow-desktop-ai-release",
      ]),
    ],
  };
  assert.deepEqual(auditManifest(manifest, admitted, config), []);
  for (const permission of [
    "lapis-ai:default",
    "lapis-ai:allow-open",
    "lapis-ai:allow-submit",
  ])
    assert.ok(
      auditManifest(
        manifest,
        { ...admitted, permissions: [...admitted.permissions, permission] },
        config,
      ).some(({ code }) => code === "LD-CAPABILITY-SCOPE"),
    );
});

test("only authorized private native-client public-build links are admitted during migration", () => {
  const capabilities = JSON.parse(
    readFileSync("src-tauri/capabilities/main.json", "utf8"),
  );
  const configuration = JSON.parse(
    readFileSync("src-tauri/tauri.conf.json", "utf8"),
  );
  const terminal = {
    private: true,
    dependencies: {
      "@lapismd/terminal": "link:../lapis-terminal/packages/terminal",
    },
  };
  assert.deepEqual(auditManifest(terminal, capabilities, configuration), []);
  const ai = {
    private: true,
    devDependencies: { "@lapismd/ai": "link:../lapis-ai/packages/ai" },
  };
  assert.deepEqual(auditManifest(ai, capabilities, configuration), []);
  for (const manifest of [
    { ...terminal, private: false },
    { private: true, dependencies: { "@lapismd/terminal": "link:../other" } },
    { private: true, dependencies: { other: "link:../other" } },
    { ...ai, private: false },
    { private: true, dependencies: { "@lapismd/ai": "link:../other" } },
  ])
    assert.ok(
      auditManifest(manifest, capabilities, configuration).some(
        (value) => value.code === "LD-PACKAGE-LOCAL",
      ),
    );
});

test("desktop AI cannot restore controller, Node or legacy execution imports", () => {
  for (const source of [
    'export { Context } from "@lapismd/ai-controller/memory/lapis";',
    'import { host } from "@lapismd/ai-host";',
    'import fs from "node:fs";',
    'const module = "./user-agents-node.js"; import(module);',
    'import { run } from "acpx/runtime";',
    'bridge.call("desktop_agent_acp_start", {});',
  ]) {
    assert.ok(
      auditSources(["src/lib/ai/example.ts"], () => source).some(
        (finding) => finding.code === "LD-AI-HOST-RUNTIME",
      ),
      source,
    );
  }
  assert.deepEqual(
    auditSources(
      ["src/lib/ai/example.ts"],
      () => 'import { createTauriAcpClient } from "@lapismd/ai/tauri";',
    ),
    [],
  );
});
