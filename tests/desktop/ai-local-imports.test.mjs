import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  existsSync,
} from "node:fs";
import { resolve, join, dirname } from "node:path";
import { createHash } from "node:crypto";
import { parse } from "yaml";
import { nativeSession } from "./native-session.mjs";

process.env.LAPIS_DESKTOP_ACCEPTANCE_NATIVE_AI = "1";
const hash = (path) =>
  createHash("sha256").update(readFileSync(path)).digest("hex");
function metadataFiles(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? metadataFiles(join(root, e.name))
      : e.name === "metadata.yaml"
        ? [join(root, e.name)]
        : [],
  );
}
async function command(session, name) {
  await session.browser.$('button[aria-label="Open command palette"]').click();
  const input = session.browser.$('[role="dialog"] input');
  await input.waitForDisplayed();
  await input.setValue(name);
  await session.browser.$(`[role="option"]*=${name}`).click();
}
async function importPanel(session) {
  await command(session, "Open Import AI sessions");
  await session.browser.$('[data-testid="ai-import-panel"]').waitForDisplayed();
  const preview = session.browser.$(
    'button[aria-label="Preview Codex CLI session"]',
  );
  await preview.waitForEnabled({ timeout: 30_000 });
  await preview.click();
  const save = session.browser.$("button*=Import snapshot");
  await save.waitForEnabled({ timeout: 30_000 });
  await session.browser.waitUntil(async () =>
    (
      await session.browser.$('[data-testid="ai-import-panel"]').getText()
    ).includes("Native import answer"),
  );
  return save;
}
async function snapshotPanel(session) {
  for (const panel of await session.browser.$$(
    'section[aria-label="Imported transcript preview"]',
  ))
    if (await panel.isDisplayed()) return panel;
}
async function visibleSnapshot(session) {
  await session.browser.waitUntil(async () => {
    const panel = await snapshotPanel(session);
    return Boolean(
      panel && (await panel.getText()).includes("Native import answer"),
    );
  });
  return snapshotPanel(session);
}
async function noProvider(session) {
  const result = await session.browser.execute(async () => {
    try {
      return {
        sessions: await globalThis.__TAURI__.core.invoke(
          "plugin:lapis-ai|list",
        ),
        failure: null,
      };
    } catch (error) {
      return { sessions: null, failure: String(error?.message ?? error) };
    }
  });
  assert.deepEqual(
    result,
    { sessions: null, failure: "vault_admission_unavailable" },
    "Import must not grant ACP execution admission merely to read local files",
  );
}

test(
  "native Codex import saves, deduplicates and cold-opens read-only local history without a provider or JJ",
  { timeout: 180_000 },
  async (context) => {
    mkdirSync(resolve(".local/native-test"), { recursive: true });
    const root = mkdtempSync(resolve(".local/native-test/ai-local-imports-"));
    const vault = join(root, "Imported Notes");
    mkdirSync(vault);
    writeFileSync(join(vault, "Keep.md"), "# Preserved native note\n");
    const source = join(
      root,
      "import-home/.codex/sessions/2026/10/19/rollout.jsonl",
    );
    mkdirSync(dirname(source), { recursive: true });
    const records = [
      {
        timestamp: "2026-10-19T09:00:00.000Z",
        type: "session_meta",
        payload: {
          id: "12345678-1234-1234-1234-123456789abc",
          cwd: vault,
          cli_version: "0.156.1",
          source: "vscode",
          originator: "lapis-acp",
        },
      },
      {
        timestamp: "2026-10-19T09:00:01.000Z",
        type: "response_item",
        payload: {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text: "Review a captured note" }],
        },
      },
      {
        timestamp: "2026-10-19T09:00:02.000Z",
        type: "response_item",
        payload: {
          type: "function_call",
          call_id: "read-note",
          name: "read_file",
          arguments: JSON.stringify({ path: join(vault, "Keep.md") }),
        },
      },
      {
        timestamp: "2026-10-19T09:00:03.000Z",
        type: "response_item",
        payload: {
          type: "function_call_output",
          call_id: "read-note",
          output: "# Preserved native note",
        },
      },
      {
        timestamp: "2026-10-19T09:00:04.000Z",
        type: "response_item",
        payload: {
          type: "message",
          role: "assistant",
          content: [
            {
              type: "output_text",
              text: "## Native import answer\n\n| Status | Note |\n| --- | --- |\n| Captured | Local only |\n\n```markdown\n# Preserved native note\n```",
            },
          ],
        },
      },
      {
        timestamp: "2026-10-19T09:00:05.000Z",
        type: "response_item",
        payload: {
          type: "reasoning",
          encrypted_content: "NEVER-IMPORT-PRIVATE-REASONING",
        },
      },
    ];
    writeFileSync(source, records.map(JSON.stringify).join("\n") + "\n");
    const sourceHash = hash(source);
    const first = await nativeSession("ai-local-imports", root, undefined, [], {
      background: true,
    });
    context.after(first.cleanup);
    writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
    await first.browser.$("button*=Open Vault").click();
    await first.browser.$('[data-notes-ready="true"]').waitForDisplayed();
    try {
      const save = await importPanel(first);
      assert.equal(
        metadataFiles(vault).length,
        0,
        "preview cannot write a conversation",
      );
      await save.click();
      await first.browser.$("button*=Open saved snapshot").waitForEnabled();
      await first.browser.$("button*=Check saved snapshot").click();
      await first.browser.waitUntil(async () =>
        (
          await first.browser.$('[data-testid="ai-import-panel"]').getText()
        ).includes("This snapshot is already saved."),
      );
      const metadata = metadataFiles(vault);
      assert.equal(metadata.length, 1);
      const m = parse(readFileSync(metadata[0], "utf8"));
      assert.equal(m.imported.state, "complete");
      assert.equal(m.activeAgentBindingId, undefined);
      const journal = join(dirname(metadata[0]), "transcript.jsonl");
      const entries = readFileSync(journal, "utf8")
        .trim()
        .split("\n")
        .map(JSON.parse);
      assert.equal(entries.find((e) => e.type === "tool").state, "unknown");
      assert.ok(entries.every((e) => e.provenance.originClass === "untrusted"));
      assert.equal(
        readFileSync(join(dirname(metadata[0]), "agents.jsonl"), "utf8"),
        "",
      );
      assert.equal(
        readFileSync(journal, "utf8").includes(
          "NEVER-IMPORT-PRIVATE-REASONING",
        ),
        false,
      );
      assert.equal(readFileSync(journal, "utf8").includes(vault), false);
      const journalHash = hash(journal);
      await first.browser.$("button*=Open saved snapshot").click();
      const savedPanel = await visibleSnapshot(first);
      assert.equal(
        await savedPanel
          .$('[contenteditable="true"][aria-label="Message"]')
          .isExisting(),
        false,
      );
      assert.equal(
        await first.browser
          .$('[contenteditable="true"][aria-label="Message"]')
          .isExisting(),
        false,
      );
      await noProvider(first);
      await first.close(true);
      const cold = await nativeSession(
        "ai-local-imports-cold",
        root,
        undefined,
        [],
        { background: true },
      );
      context.after(cold.cleanup);
      await cold.browser.$('[data-notes-ready="true"]').waitForDisplayed();
      const coldPanel = await visibleSnapshot(cold);
      assert.equal(
        await coldPanel
          .$('[contenteditable="true"][aria-label="Message"]')
          .isExisting(),
        false,
      );
      assert.equal(
        await cold.browser
          .$('[contenteditable="true"][aria-label="Message"]')
          .isExisting(),
        false,
      );
      assert.equal(
        hash(journal),
        journalHash,
        "cold read must not rewrite or replay imported content",
      );
      await noProvider(cold);
      await cold.close(true);
      assert.equal(hash(source), sourceHash);
      assert.equal(
        readFileSync(join(vault, "Keep.md"), "utf8"),
        "# Preserved native note\n",
      );
      assert.equal(existsSync(join(vault, ".jj")), false);
      assert.equal(existsSync(join(root, "acp-peer.jsonl")), false);
      console.log(`Native import evidence: ${root}`);
    } catch (error) {
      writeFileSync(
        join(root, "failure-ui.txt"),
        await first.browser
          .execute(() => document.body.innerText)
          .catch(String),
      );
      throw error;
    }
  },
);
