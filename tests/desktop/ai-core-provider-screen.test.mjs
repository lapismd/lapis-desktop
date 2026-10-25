import assert from "node:assert/strict";
import test from "node:test";
import { createHash, randomUUID } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { nativeSession } from "./native-session.mjs";
import { reloadNotes } from "./workspace-navigation.mjs";

test(
  "real provider survives retained Desktop composer reload teardown and cold History recovery without replay",
  {
    skip: process.env.LAPIS_AI_TEST_CORE_SCREEN_PROVIDER !== "1",
    timeout: 240_000,
  },
  async (context) => {
    const configuration = process.env.LAPIS_AI_TEST_RUNTIME_CONFIG;
    assert.ok(
      configuration,
      "Select an explicit native provider configuration",
    );
    const previous = {
      LAPIS_DESKTOP_AI_OWNER: process.env.LAPIS_DESKTOP_AI_OWNER,
      LAPIS_DESKTOP_ACCEPTANCE_NATIVE_AI:
        process.env.LAPIS_DESKTOP_ACCEPTANCE_NATIVE_AI,
    };
    context.after(() => {
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    });
    process.env.LAPIS_DESKTOP_AI_OWNER = "core";
    process.env.LAPIS_DESKTOP_ACCEPTANCE_NATIVE_AI = "1";
    mkdirSync(resolve(".local/native-test"), { recursive: true });
    const root = mkdtempSync(
      resolve(".local/native-test/core-provider-screen-"),
    );
    const vault = join(root, "Provider Notes");
    mkdirSync(join(vault, ".lapis"), { recursive: true });
    mkdirSync(join(root, "profile"));
    writeFileSync(
      join(root, "profile/ai-runtime.json"),
      readFileSync(configuration),
    );
    writeFileSync(
      join(vault, "Note.md"),
      "# Isolated native screen acceptance\n",
    );
    writeFileSync(
      join(vault, ".lapis/core-plugins.json"),
      JSON.stringify({ disabled: [], enabled: ["ai"] }),
    );
    const witness = `SCREEN-${randomUUID()}`;
    const prompt = `Return exactly the string ${witness}. Do not inspect files or use tools.`;
    const receipt = { root, witness, stages: [] };
    function save(stage, facts = {}) {
      receipt.stages.push({ stage, at: new Date().toISOString(), ...facts });
      writeFileSync(
        join(root, "receipt.json"),
        JSON.stringify(receipt, null, 2),
      );
      console.log(stage, JSON.stringify(facts));
    }
    let session;
    let held = false;
    async function launch(name, cold = false) {
      session = await nativeSession(name, root, undefined, [], {
        background: false,
      });
      if (!cold) {
        writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
        await session.browser.$("button*=Open Vault").click();
      }
      await session.browser
        .$('[data-notes-ready="true"]')
        .waitForDisplayed({ timeout: 45_000 });
    }
    async function installAudit() {
      await session.browser.execute(() => {
        const original = globalThis.fetch.bind(globalThis);
        const audit = { calls: [], accepted: null, held: false };
        globalThis.__coreScreenAcceptance = audit;
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
            kind: args?.request?.command?.kind,
            reload: args?.request?.reload ?? args?.reload,
            startedAt: Date.now(),
          };
          audit.calls.push(call);
          if (command === "lifecycle_result" && args.saved === true) {
            audit.held = true;
            audit.heldAt = Date.now();
            await new Promise((resume) => {
              audit.resume = () => {
                globalThis.fetch = original;
                resume();
              };
            });
          }
          try {
            const response = await original(resource, options);
            call.settledAt = Date.now();
            if (response.headers.get("Tauri-Response") !== "ok")
              call.error = "Native command refused";
            if (command === "desktop_ai_turn" && call.kind === "submit") {
              const value = await response.clone().json();
              audit.accepted = value.record;
            }
            return response;
          } catch (error) {
            call.error = String(error?.message ?? error);
            throw error;
          }
        };
      });
    }
    const audit = () =>
      session.browser.execute(() => {
        const state = globalThis.__coreScreenAcceptance;
        if (!state) return null;
        const { resume: _resume, ...value } = state;
        return value;
      });
    async function resumeReload() {
      await session.browser.execute(() => {
        setTimeout(() => globalThis.__coreScreenAcceptance?.resume?.(), 0);
      });
      held = false;
    }
    function journalFiles() {
      return readdirSync(join(root, "profile/turns"), {
        recursive: true,
        withFileTypes: true,
      })
        .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
        .map((entry) => join(entry.parentPath, entry.name));
    }
    try {
      await launch("core-provider-screen");
      await installAudit();
      await session.browser.$('button[aria-label="Open Chat"]').click();
      // Real helper admission performs native IO. Join it before testing the
      // composer's ready state, using the existing native-command wait budget.
      await session.browser.waitUntil(
        async () => {
          const calls = (await audit()).calls.filter(
            (call) => call.command === "desktop_ai_admit",
          );
          assert.ok(
            calls.every((call) => !call.error),
            "Native admission failed",
          );
          return calls.some((call) => call.settledAt);
        },
        { timeout: 120_000, interval: 100 },
      );
      const composer = session.browser.$(
        '[contenteditable="true"][aria-label="Message"]',
      );
      await composer.waitForDisplayed();
      await composer.addValue(prompt);
      const send = session.browser.$('button[aria-label="Send message"]');
      await send.waitForEnabled({ timeout: 30_000 });
      await send.click();
      await session.browser.waitUntil(async () => !!(await audit()).accepted, {
        timeout: 30_000,
        interval: 50,
      });
      const accepted = (await audit()).accepted;
      assert.ok(["accepted", "running"].includes(accepted.phase));
      assert.equal(accepted.input.target_id, "codex");
      assert.equal(accepted.input.options.mode, "read-only");
      assert.equal(accepted.input.prompt, prompt);
      save("accepted-through-composer", { record: accepted });
      held = true;
      await reloadNotes(session.browser);
      await session.browser.waitUntil(async () => (await audit()).held, {
        timeout: 30_000,
        interval: 50,
      });
      const detachedAudit = await audit();
      for (const command of ["desktop_ai_release", "vault_close"])
        assert.ok(
          detachedAudit.calls.some(
            (call) =>
              call.command === command &&
              call.reload === true &&
              call.settledAt <= detachedAudit.heldAt &&
              !call.error,
          ),
          `${command} must finish ordinary reload teardown before the gate`,
        );
      assert.equal(
        await session.browser.$('[data-notes-ready="true"]').isExisting(),
        false,
      );
      const files = journalFiles();
      assert.equal(files.length, 1);
      const journal = files[0];
      let record = JSON.parse(readFileSync(journal, "utf8"));
      assert.equal(record.input.request_id, accepted.input.request_id);
      assert.ok(["accepted", "running"].includes(record.phase));
      save("ordinary-reload-observer-detached", {
        phase: record.phase,
        audit: detachedAudit,
      });
      const deadline = Date.now() + 90_000;
      while (
        ["accepted", "running"].includes(record.phase) &&
        Date.now() < deadline
      ) {
        await delay(100);
        record = JSON.parse(readFileSync(journal, "utf8"));
      }
      assert.equal(record.phase, "completed");
      assert.equal(record.output.trim(), witness);
      const finalAudit = await audit();
      assert.equal(
        finalAudit.calls.filter(
          (call) =>
            call.command === "desktop_ai_turn" &&
            call.startedAt >= finalAudit.heldAt,
        ).length,
        0,
        "No client turn call may occur while the observer is disposed",
      );
      assert.equal(
        finalAudit.calls.filter(
          (call) =>
            call.command === "desktop_ai_turn" && call.kind === "submit",
        ).length,
        1,
      );
      const transcript = join(
        vault,
        ".lapis/agents/sessions",
        record.conversation_id,
        "transcript.jsonl",
      );
      const hash = () =>
        createHash("sha256").update(readFileSync(transcript)).digest("hex");
      const before = hash();
      save("completed-without-observer", {
        record,
        transcriptSha256: before,
        audit: finalAudit,
      });
      await resumeReload();
      await session.browser
        .$('[data-notes-ready="true"]')
        .waitForDisplayed({ timeout: 45_000 });
      async function recoverHistory() {
        const history = session.browser.$(
          '[data-testid="ai-conversation-history"]',
        );
        if (!(await history.isDisplayed())) {
          await session.browser
            .$('button[aria-label="Conversation actions"]')
            .click();
          await session.browser
            .$(
              '//*[@role="menuitem" and normalize-space(.)="AI conversations"]',
            )
            .click();
        }
        await history.waitForDisplayed({ timeout: 30_000 });
        const opener = history.$(
          `.//button[starts-with(normalize-space(.), "Return exactly the string ${witness}")]`,
        );
        // A cold History panel mounts before native agent admission completes.
        // Join its saved row within the same recovery budget as the transcript.
        await opener.waitForDisplayed({ timeout: 30_000 });
        await opener.click();
        let activeChats;
        await session.browser.waitUntil(
          async () => {
            activeChats = [];
            for (const chat of await session.browser.$$(
              '[data-native-chat="true"]:has([contenteditable="true"][aria-label="Message"])',
            ))
              if (await chat.isDisplayed()) activeChats.push(chat);
            return activeChats.length === 1;
          },
          { timeout: 30_000 },
        );
        assert.equal(activeChats.length, 1);
        const reply = activeChats[0].$(
          `.//*[normalize-space(text())="${witness}"]`,
        );
        await reply.waitForDisplayed({ timeout: 30_000 });
        assert.equal((await reply.getText()).trim(), witness);
        assert.equal(await history.isDisplayed(), true);
        assert.equal(
          await session.browser.execute(
            () =>
              document
                .querySelector('[data-testid="ai-conversation-history"]')
                .closest("[data-workspace-surface]").dataset.workspaceSurface,
          ),
          "right-sidebar",
        );
        assert.deepEqual(JSON.parse(readFileSync(journal, "utf8")), record);
        assert.equal(hash(), before);
        assert.equal(journalFiles().length, 1);
      }
      await recoverHistory();
      save("reloaded-history-retained", { transcriptSha256: hash() });
      await session.close(true);
      await launch("core-provider-screen-cold", true);
      await recoverHistory();
      await delay(1000);
      assert.deepEqual(JSON.parse(readFileSync(journal, "utf8")), record);
      assert.equal(hash(), before);
      assert.equal(journalFiles().length, 1);
      save("cold-history-retained", { transcriptSha256: hash() });
      await session.close(true);
      save("complete");
    } catch (error) {
      const ui = await session?.browser
        .execute(() => ({
          text: document.body.innerText,
          editors: [...document.querySelectorAll("[contenteditable]")].map(
            (element) => ({
              label: element.getAttribute("aria-label"),
              editable: element.getAttribute("contenteditable"),
              visible: element.getClientRects().length > 0,
            }),
          ),
        }))
        .catch(String);
      save("failed", {
        error: String(error.stack ?? error),
        ui,
        audit: await audit().catch(String),
      });
      throw error;
    } finally {
      if (session?.isRunning()) {
        if (held) await resumeReload().catch(() => {});
        await session.cleanup();
      }
    }
  },
);
