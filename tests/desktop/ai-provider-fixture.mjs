import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
  readdirSync,
} from "node:fs";
import { join, resolve, dirname } from "node:path";
import { parse } from "yaml";
import { nativeSession } from "./native-session.mjs";
import { focusNativeWindow } from "./native-visibility.mjs";

export const labels = {
  codex: "Codex",
  cursor: "Cursor",
  opencode: "OpenCode",
  local: "Lapis AI",
};
export const configuration = process.env.LAPIS_AI_TEST_RUNTIME_CONFIG;
export const records = (path) =>
  readFileSync(path, "utf8").trim().split("\n").filter(Boolean).map(JSON.parse);
export const hash = (path) =>
  createHash("sha256").update(readFileSync(path)).digest("hex");
export function metadataFiles(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? metadataFiles(join(root, entry.name))
      : entry.name === "metadata.yaml"
        ? [join(root, entry.name)]
        : [],
  );
}
export async function invoke(session, command, args = {}) {
  const key = randomUUID();
  await session.browser.execute(
    (key, command, args) => {
      const results = (globalThis.__providerAcceptanceResults ??= {});
      globalThis.__TAURI__.core.invoke(command, args).then(
        (value) => {
          results[key] = { value };
        },
        (error) => {
          results[key] = { error: String(error?.message ?? error) };
        },
      );
    },
    key,
    command,
    args,
  );
  await session.browser.waitUntil(
    () =>
      session.browser.execute(
        (key) => Object.hasOwn(globalThis.__providerAcceptanceResults, key),
        key,
      ),
    {
      timeout: 120_000,
      interval: 100,
      timeoutMsg: `${command} did not settle`,
    },
  );
  const result = await session.browser.execute((key) => {
    const result = globalThis.__providerAcceptanceResults[key];
    delete globalThis.__providerAcceptanceResults[key];
    return result;
  }, key);
  assert.equal(result.error, undefined, `${command}: ${result.error}`);
  return result.value;
}
export async function ready(session) {
  await session.browser
    .$('[data-notes-ready="true"]')
    .waitForDisplayed({ timeout: 45_000 });
  if (!(await session.browser.$('[data-testid="ai-chat-panel"]').isDisplayed()))
    await session.browser.$('button[aria-label="Open Chat"]').click();
  await session.browser
    .$(
      '[data-testid="ai-chat-panel"][data-initializing="false"][data-model-catalog-loading="false"]',
    )
    .waitForDisplayed({ timeout: 60_000 });
  if (process.env.LAPIS_AI_TEST_HEADED === "1")
    await focusNativeWindow(session.browser);
}
export async function send(session, text) {
  await session.browser
    .$('[contenteditable="true"][aria-label="Message"]')
    .addValue(text);
  const button = session.browser.$('button[aria-label="Send message"]');
  await button.waitForEnabled({ timeout: 30_000 });
  await button.click();
}
export async function providerPermissions(session) {
  for (const card of await session.browser.$$(
    '[data-testid="ai-approval-card"][data-origin="runtime"]',
  )) {
    if (!(await card.isDisplayed())) continue;
    const title = (await card.$("strong").getText()).trim();
    assert.match(
      title,
      /^(?:mcp[._]lapis-tools[._](?:read|edit)|lapis-tools-read: read|lapis-tools-edit: edit)$/u,
      "Only the two requested application tools may be approved",
    );
    const choices = await card.$$('button[data-approval-kind="allow-once"]');
    assert.equal(choices.length, 1);
    if (await choices[0].isEnabled()) await choices[0].click();
  }
}
export async function completed(session, metadata, predicate) {
  let failure;
  await session.browser.waitUntil(
    async () => {
      await providerPermissions(session);
      const entries = records(join(dirname(metadata), "transcript.jsonl"));
      const pending = parse(readFileSync(metadata, "utf8")).pendingTurn;
      const unknown =
        pending &&
        entries.find((entry) => entry.id === `turn-unknown:${pending.id}`);
      if (unknown) {
        failure = unknown.message;
        return true;
      }
      if (pending) return false;
      if (predicate(entries)) return true;
      const user = entries.findLastIndex(
        (e) => e.type === "message" && e.role === "user",
      );
      const terminal = entries.findLastIndex(
        (e) =>
          e.type === "error" ||
          (e.type === "message" && e.role === "assistant"),
      );
      if (terminal > user) {
        failure = entries[terminal].message ?? entries[terminal].text;
        return true;
      }
      return false;
    },
    { timeout: 180_000, interval: 200 },
  );
  assert.equal(failure, undefined, failure);
}
export async function pendingApproval(session) {
  let result;
  await session.browser.waitUntil(
    async () => {
      await providerPermissions(session);
      for (const card of await session.browser.$$(
        '[data-testid="ai-approval-card"][data-origin="app-tool"]',
      )) {
        if (
          (await card.isDisplayed()) &&
          (await card.$("button*=Allow once").isEnabled())
        ) {
          result = card;
          return true;
        }
      }
      return false;
    },
    { timeout: 180_000, interval: 200 },
  );
  return result;
}
export async function fixture(client, context) {
  process.env.LAPIS_DESKTOP_ACCEPTANCE_NATIVE_AI = "1";
  mkdirSync(resolve(".local/native-test"), { recursive: true });
  const root = mkdtempSync(
    resolve(`.local/native-test/ai-provider-${client}-`),
  );
  const vault = join(root, "Provider Notes"),
    note = join(vault, "Note.md");
  mkdirSync(join(vault, ".lapis/plugins/ai"), { recursive: true });
  mkdirSync(join(root, "profile"));
  const witness = `PROVIDER-${randomUUID()}`;
  const original = `# Provider acceptance\n\nRead witness: ${witness}\n\nEditable: BEFORE\n`;
  writeFileSync(note, original);
  const runtime = JSON.parse(readFileSync(configuration, "utf8"));
  runtime.bundle = resolve("src-tauri/resources/lapis-ai");
  writeFileSync(join(root, "profile/ai-runtime.json"), JSON.stringify(runtime));
  writeFileSync(
    join(vault, ".lapis/plugins/ai/data.json"),
    JSON.stringify({
      settings: {
        acpAgent: client,
        defaultRuntime: "acp",
        thinking: "default",
        defaultModels: {
          codex: "gpt-5.6-sol",
          cursor: "",
          opencode: process.env.LAPIS_AI_TEST_OPENCODE_MODEL ?? "",
          local: "",
        },
        defaultModel:
          client === "codex"
            ? "gpt-5.6-sol"
            : client === "opencode"
              ? (process.env.LAPIS_AI_TEST_OPENCODE_MODEL ?? "")
              : "",
        memoryAutomaticRecall: false,
        memoryConsolidationEnabled: false,
        handoffSummariesEnabled: false,
      },
    }),
  );
  let active;
  const launch = async (suffix = "") => {
    active = await nativeSession(
      `provider-${client}${suffix}`,
      root,
      undefined,
      [],
      { background: process.env.LAPIS_AI_TEST_HEADED !== "1" },
    );
    return active;
  };
  context.after(async () => {
    if (active?.isRunning()) {
      writeFileSync(
        join(root, "ui.txt"),
        await active.browser
          .execute(() => document.body.innerText)
          .catch(String),
      );
      await active.cleanup();
    }
  });
  const session = await launch();
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  await session.browser.$("button*=Open Vault").click();
  await session.browser
    .$('[data-notes-ready="true"]')
    .waitForDisplayed({ timeout: 45_000 });
  console.log(`Provider ${client} evidence: ${root}`);
  return {
    root,
    vault,
    note,
    witness,
    original,
    session,
    launch,
  };
}
