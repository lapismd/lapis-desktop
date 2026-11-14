import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const source = readFileSync(
  new URL("../../src/lib/native/skill-management.ts", import.meta.url),
  "utf8",
);
const javascript = ts.transpileModule(
  source.replace(
    'import { invoke } from "@tauri-apps/api/core";',
    'const invoke = () => { throw Error("unexpected default transport") };',
  ),
  { compilerOptions: { module: ts.ModuleKind.ESNext } },
).outputText;
const { createSkillManagement } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`
);
test("commands retain admitted session identity and selected skill", async () => {
  const calls = [];
  const host = createSkillManagement(
    { sessionId: "selected" },
    async (command, input) => {
      calls.push({ command, input });
      return [
        {
          name: "lapis-markdown",
          status: "skipped",
          reason: "locally-modified",
        },
      ];
    },
  );
  const result = await host.manage("update", "lapis-markdown");
  assert.deepEqual(calls, [
    {
      command: "vault_skills",
      input: {
        sessionId: "selected",
        action: "update",
        skill: "lapis-markdown",
      },
    },
  ]);
  assert.equal(result[0].reason, "locally-modified");
});
