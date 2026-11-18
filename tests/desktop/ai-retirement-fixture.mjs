import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { historicalAiFiles } from "./historical-ai-files.mjs";

/** Seed existing files; registry installation and native startup remain separate. */
export function seedRetiredAi(vault, disabledBy, kind = "synthetic") {
  assert.ok(["synthetic", "historical"].includes(kind));
  const now =
    kind === "historical"
      ? "2026-11-17T00:00:00.000Z"
      : "2026-01-01T00:00:00.000Z";
  const id = "11111111-1111-4111-8111-111111111111";
  const session = `.lapis/agents/sessions/${id}`;
  const manifest = JSON.stringify({
    id: "ai",
    name: "Retired shared AI fixture",
    version: "0.1.16",
    minAppVersion: "0.0.1",
    author: "Lapis Notes",
    description: "Installed external copy must remain inert behind bundled AI",
  });
  const main =
    'globalThis.__retiredSharedAiEvaluated = true; throw new Error("Retired shared AI evaluated");\n';
  const files =
    kind === "historical"
      ? historicalAiFiles()
      : { "manifest.json": manifest, "main.js": main };
  const installed = {
    schemaVersion: 1,
    updatedAt: now,
    plugins: {
      ai: {
        pluginId: "ai",
        installedVersion: "0.1.16",
        installedAt: now,
        updatedAt: now,
        provenance: "official",
        registryUrl: "https://registry.lapis.md",
        ...(disabledBy === "installed" ? { enabled: false } : {}),
        files: Object.entries(files).map(([path, text]) => ({
          path,
          size: Buffer.byteLength(text),
          sha256: createHash("sha256").update(text).digest("hex"),
        })),
      },
    },
  };
  const saved = {
    ...Object.fromEntries(
      Object.entries(files).map(([path, text]) => [
        `.lapis/plugins/ai/${path}`,
        text,
      ]),
    ),
    ".lapis/installed-plugins.json": JSON.stringify(installed),
    ".lapis/community-plugins.json": '["ai"]',
    ".lapis/plugins/ai/data.json": JSON.stringify({
      settings: { defaultRuntime: "fake", memoryFolder: "Memory" },
      sessions: [{ id: "legacy-controller-session", runtimeSessionId: "old" }],
      futureValue: { keep: true },
    }),
    [`${session}/metadata.yaml`]: `schemaVersion: 1\nid: ${id}\ntitle: Preserved retirement conversation\ncreatedAt: '${now}'\nupdatedAt: '${now}'\nstatus: active\n`,
    [`${session}/agents.jsonl`]: "",
    [`${session}/transcript.jsonl`]:
      JSON.stringify({
        schemaVersion: 1,
        id: "kept-message",
        createdAt: now,
        type: "message",
        role: "user",
        text: "Preserve this conversation without submitting it",
      }) + "\n",
    "Memory/kept-retirement-memory.md":
      "# Retained memory\n\nKeep café 笔记.\n",
    ...(disabledBy === "app-shell"
      ? { ".lapis/app-shell-plugins.json": '{"ai":false}' }
      : {}),
  };
  for (const [path, text] of Object.entries(saved)) {
    const target = join(vault, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, text);
  }
  return () => {
    for (const [path, text] of Object.entries(saved))
      assert.deepEqual(
        readFileSync(join(vault, path)),
        Buffer.from(text),
        path,
      );
  };
}
