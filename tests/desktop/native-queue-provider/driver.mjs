import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { nativeSession } from "../native-session.mjs";
import { reloadNotes } from "../workspace-navigation.mjs";
import {
  queueEnvironment,
  nativeQueueSuccess,
} from "../native-queue-fixture.mjs";

export function providerDriver(context, name) {
  queueEnvironment(context);
  const configuration = process.env.LAPIS_AI_TEST_RUNTIME_CONFIG;
  assert.ok(
    configuration,
    "Select an explicit qualified native runtime configuration",
  );
  const config = JSON.parse(readFileSync(configuration, "utf8"));
  assert.deepEqual(Object.keys(config).sort(), ["bundle", "path", "version"]);
  assert.equal(config.version, 1);
  mkdirSync(resolve(".local/native-test"), { recursive: true });
  const root = mkdtempSync(resolve(".local/native-test/queue-provider-"));
  const vault = join(root, "Provider Notes");
  mkdirSync(join(vault, ".lapis"), { recursive: true });
  mkdirSync(join(root, "profile"));
  const originalNote = "# Isolated native provider qualification\n";
  writeFileSync(join(vault, "Note.md"), originalNote);
  writeFileSync(
    join(vault, ".lapis/core-plugins.json"),
    JSON.stringify({ disabled: [], enabled: ["ai"] }),
  );
  writeFileSync(join(root, "profile/ai-runtime.json"), JSON.stringify(config), {
    mode: 0o600,
  });
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  const witness = randomUUID();
  const receipt = { name, root, witness, stages: [] };
  let session;
  let held = false;
  function save(stage, facts = {}) {
    receipt.stages.push({ stage, at: new Date().toISOString(), ...facts });
    writeFileSync(
      join(root, "receipt.json"),
      JSON.stringify(receipt, null, 2),
      { mode: 0o600 },
    );
  }
  const audit = () =>
    session.browser.execute(() => {
      const { resume: _resume, ...state } =
        globalThis.__queueProviderAcceptance;
      return state;
    });
  async function installAudit() {
    await session.browser.execute(() => {
      const original = globalThis.fetch.bind(globalThis);
      const state = {
        calls: [],
        submitted: [],
        accepted: [],
        resumed: [],
        held: false,
        holdReload: false,
      };
      globalThis.__queueProviderAcceptance = state;
      globalThis.fetch = async (resource, options) => {
        const url = new URL(
          typeof resource === "string" ? resource : resource.url,
          location.href,
        );
        if (url.protocol !== "ipc:" && url.hostname !== "ipc.localhost")
          return original(resource, options);
        const command = decodeURIComponent(url.pathname.slice(1));
        const args =
          typeof options?.body === "string" ? JSON.parse(options.body) : {};
        const call = {
          command,
          kind: args.request?.command?.kind,
          at: Date.now(),
        };
        state.calls.push(call);
        if (args.request?.sessionId && command.startsWith("desktop_ai_"))
          state.sessionId = args.request.sessionId;
        if (command === "desktop_ai_queue" && call.kind === "resume")
          state.resumed.push(args.request.command);
        if (
          state.holdReload &&
          command === "lifecycle_result" &&
          args.saved === true
        ) {
          state.held = true;
          state.heldAt = Date.now();
          await new Promise((resume) => {
            state.resume = () => {
              globalThis.fetch = original;
              resume();
            };
          });
        }
        const response = await original(resource, options);
        call.finished = Date.now();
        if (
          command.startsWith("desktop_ai_") &&
          response.headers.get("Tauri-Response") !== "ok"
        )
          call.failure = await response.clone().text();
        if (response.headers.get("Tauri-Response") === "ok") {
          if (command === "desktop_ai_turn" && call.kind === "submit")
            state.submitted.push((await response.clone().json()).record);
          if (command === "desktop_ai_queue" && call.kind === "accept")
            state.accepted.push((await response.clone().json()).queue);
        }
        return response;
      };
    });
  }
  async function launch(label, cold = false) {
    session = await nativeSession(label, root, undefined, [], {
      background: false,
    });
    context.after(session.cleanup);
    await installAudit();
    if (!cold) await session.browser.$("button*=Open Vault").click();
    await session.browser
      .$('[data-notes-ready="true"]')
      .waitForDisplayed({ timeout: 45000 });
  }
  async function openChat() {
    await session.browser.$('button[aria-label="Open Chat"]').click();
    await session.browser.waitUntil(
      async () => {
        const state = await audit();
        return (
          state.sessionId &&
          state.calls.some(
            (call) => call.command === "desktop_ai_admit" && call.finished,
          )
        );
      },
      { timeout: 120000 },
    );
  }
  async function send(text) {
    let editor;
    await session.browser.waitUntil(
      async () => {
        const visible = [];
        for (const candidate of await session.browser.$$(
          '[role="group"][aria-label="Message composer"] [contenteditable="true"][aria-label="Message"]',
        ))
          if (await candidate.isDisplayed()) visible.push(candidate);
        if (visible.length !== 1) return false;
        editor = visible[0];
        return true;
      },
      { timeout: 30000 },
    );
    await editor.addValue(text);
    let action;
    await session.browser.waitUntil(
      async () => {
        for (const candidate of await session.browser.$$(
          'button[aria-label="Send message"], button[aria-label="Queue message"]',
        ))
          if (
            (await candidate.isDisplayed()) &&
            (await candidate.isEnabled())
          ) {
            action = candidate;
            return true;
          }
        return false;
      },
      { timeout: 30000 },
    );
    await action.click();
    await session.browser.waitUntil(
      () =>
        session.browser.execute((element) => {
          const draft = element.cloneNode(true);
          draft
            .querySelectorAll('[contenteditable="false"]')
            .forEach((node) => node.remove());
          return draft.textContent.trim() === "";
        }, editor),
      { timeout: 30000 },
    );
  }
  async function queue(command) {
    const state = await audit();
    assert.ok(state.sessionId, "Use the current admitted UI session");
    return nativeQueueSuccess(session, "desktop_ai_queue", {
      request: { sessionId: state.sessionId, command },
    });
  }
  const journal = (record) =>
    join(
      root,
      "profile/turns",
      record.vault_id,
      `${record.input.request_id}.json`,
    );
  const readTurn = (record) =>
    JSON.parse(readFileSync(journal(record), "utf8"));
  async function terminal(record) {
    let value;
    await session.browser.waitUntil(
      () => {
        if (!existsSync(journal(record))) return false;
        value = readTurn(record);
        return !["accepted", "running"].includes(value.phase);
      },
      { timeout: 90000, interval: 100 },
    );
    return value;
  }
  async function cancel(text) {
    await session.browser.waitUntil(
      async () => {
        for (const card of await session.browser.$$(
          '[aria-label="Queued messages"] article',
        ))
          if ((await card.getText()).includes(text)) return true;
        return false;
      },
      { timeout: 30000 },
    );
    const cards = await session.browser.$$(
      '[aria-label="Queued messages"] article',
    );
    let card;
    for (const candidate of cards)
      if ((await candidate.getText()).includes(text)) {
        card = candidate;
        break;
      }
    assert.ok(card);
    const button = await card.$(
      'button[aria-label="Cancel queued message for Codex"]',
    );
    await session.browser.execute((button) => button.focus(), button);
    await session.browser.waitUntil(() =>
      session.browser.execute((button) => {
        const rect = button.getBoundingClientRect();
        return (
          getComputedStyle(button).pointerEvents === "auto" &&
          button.contains(
            document.elementFromPoint(
              rect.x + rect.width / 2,
              rect.y + rect.height / 2,
            ),
          )
        );
      }, button),
    );
    await button.click();
  }
  async function control(label, kind) {
    const before = (await audit()).calls.length;
    let button;
    await session.browser.waitUntil(async () => {
      for (const candidate of await session.browser.$$(`button=${label}`))
        if ((await candidate.isDisplayed()) && (await candidate.isEnabled())) {
          button = candidate;
          return true;
        }
      return false;
    });
    await session.browser.execute((element) => element.focus(), button);
    await session.browser.waitUntil(() =>
      session.browser.execute((element) => {
        const box = element.getBoundingClientRect();
        return element.contains(
          document.elementFromPoint(
            box.x + box.width / 2,
            box.y + box.height / 2,
          ),
        );
      }, button),
    );
    await button.click();
    await session.browser.waitUntil(async () =>
      (await audit()).calls
        .slice(before)
        .some(
          (call) =>
            call.command === "desktop_ai_queue" &&
            call.kind === kind &&
            call.finished,
        ),
    );
  }
  async function recover(title, reply) {
    await session.browser.$('button[aria-label="Open Chat"]').click();
    await session.browser
      .$('button[aria-label="Conversation actions"]')
      .waitForDisplayed({ timeout: 30000 });
    await session.browser
      .$('button[aria-label="Conversation actions"]')
      .click();
    await session.browser
      .$('//*[@role="menuitem" and normalize-space(.)="AI conversations"]')
      .click();
    const row = session.browser
      .$('[data-testid="ai-conversation-history"]')
      .$(`button*=${title}`);
    await row.waitForDisplayed({ timeout: 30000 });
    await row.click();
    if (reply) {
      let chat;
      await session.browser.waitUntil(
        async () => {
          const visible = [];
          for (const candidate of await session.browser.$$(
            '[data-native-chat="true"]:has([contenteditable="true"])',
          ))
            if (await candidate.isDisplayed()) visible.push(candidate);
          if (visible.length !== 1) return false;
          chat = visible[0];
          return true;
        },
        { timeout: 30000 },
      );
      await chat
        .$(`.//*[normalize-space(text())="${reply}"]`)
        .waitForDisplayed({ timeout: 30000 });
    }
  }
  async function holdReload() {
    await session.browser.execute(() => {
      globalThis.__queueProviderAcceptance.holdReload = true;
    });
    held = true;
    await reloadNotes(session.browser);
    await session.browser.waitUntil(async () => (await audit()).held, {
      timeout: 30000,
    });
    const state = await audit();
    for (const command of ["desktop_ai_release", "vault_close"])
      assert.ok(
        state.calls.some(
          (call) => call.command === command && call.finished <= state.heldAt,
        ),
      );
    return state;
  }
  async function releaseReload() {
    await session.browser.execute(() =>
      setTimeout(() => globalThis.__queueProviderAcceptance.resume(), 0),
    );
    held = false;
    await session.browser
      .$('[data-notes-ready="true"]')
      .waitForDisplayed({ timeout: 45000 });
    await installAudit();
  }
  function unchangedNote() {
    assert.equal(readFileSync(join(vault, "Note.md"), "utf8"), originalNote);
  }
  const transcript = (record) =>
    join(
      vault,
      ".lapis/agents/sessions",
      record.conversation_id,
      "transcript.jsonl",
    );
  const digest = (path) =>
    createHash("sha256").update(readFileSync(path)).digest("hex");
  const queueFile = (record) =>
    join(
      root,
      "profile/turns/queues",
      record.vault_id,
      `${record.conversation_id}.json`,
    );
  const readQueue = (record) =>
    JSON.parse(readFileSync(queueFile(record), "utf8"));
  const turnFiles = (record) =>
    readdirSync(join(root, "profile/turns", record.vault_id))
      .filter((file) => file.endsWith(".json"))
      .sort();
  function seedOffline(record, prompt) {
    assert.equal(
      session.isRunning(),
      false,
      "Stop the native app before offline fixture creation",
    );
    const path = queueFile(record),
      original = readQueue(record),
      seeded = structuredClone(original);
    assert.equal(seeded.paused, true);
    const entry = structuredClone(seeded.entries.at(-1));
    assert.equal(entry.phase, "completed");
    assert.ok(entry.target, "Preserve the real native-only target guard");
    entry.input.acceptance_id = randomUUID();
    entry.input.after_request_id = record.input.request_id;
    entry.input.capture.id = randomUUID();
    entry.input.capture.user.id = `queued-user-${randomUUID()}`;
    entry.input.capture.user.text = prompt;
    entry.input.capture.user.createdAt = new Date().toISOString();
    entry.request_id = randomUUID();
    entry.phase = "pending";
    entry.receipt = null;
    entry.receipt_published = false;
    seeded.entries.push(entry);
    assert.equal(seeded.head_request_id, record.input.request_id);
    const temporary = `${path}.offline-fixture`;
    writeFileSync(temporary, JSON.stringify(seeded), { mode: 0o600 });
    renameSync(temporary, path);
    save("offline-retained-queue-fixture-not-live-admission", {
      original,
      seeded,
    });
    return { original, seeded, entry };
  }
  async function close() {
    await session.close(true);
  }
  async function cleanup() {
    if (session?.isRunning()) {
      if (held) await releaseReload().catch(() => {});
      await session.cleanup();
    }
  }
  return {
    root,
    vault,
    witness,
    save,
    audit,
    launch,
    openChat,
    send,
    queue,
    readTurn,
    terminal,
    cancel,
    control,
    recover,
    holdReload,
    releaseReload,
    unchangedNote,
    transcript,
    digest,
    readQueue,
    turnFiles,
    seedOffline,
    close,
    cleanup,
    get session() {
      return session;
    },
  };
}

export function assertDefaults(record) {
  assert.equal(record.input.target_id, "codex");
  assert.equal(record.input.options.mode, "read-only");
  assert.equal(record.input.options.model, null);
  assert.equal(record.input.options.effort, null);
}
