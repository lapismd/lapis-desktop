import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { nativeSession } from "./native-session.mjs";
import { reloadNotes } from "./workspace-navigation.mjs";
import {
  nativeQueueFixture,
  queueEnvironment,
} from "./native-queue-fixture.mjs";

test(
  "native Agent queue controls and ordinary reload retain accepted work with no renderer scheduler or replay",
  { timeout: 180000 },
  async (context) => {
    queueEnvironment(context);
    const fixture = nativeQueueFixture();
    let session;
    let held = false;
    async function launch(name, cold = false) {
      session = await nativeSession(name, fixture.root, undefined, [], {
        background: false,
      });
      context.after(session.cleanup);
      if (!cold) await session.browser.$("button*=Open Vault").click();
      await session.browser
        .$('[data-notes-ready="true"]')
        .waitForDisplayed({ timeout: 45000 });
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
    const audit = () =>
      session.browser.execute(() => {
        const { resume: _resume, ...value } =
          globalThis.__nativeQueueAcceptance;
        return value;
      });
    async function releaseReload() {
      await session.browser.execute(() => {
        setTimeout(() => globalThis.__nativeQueueAcceptance.resume(), 0);
      });
      held = false;
    }
    try {
      await launch("native-queue-screen");
      await session.browser.execute(() => {
        const original = globalThis.fetch.bind(globalThis);
        const state = { calls: [], accepted: [], held: false };
        globalThis.__nativeQueueAcceptance = state;
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
            at: Date.now(),
          };
          state.calls.push(call);
          if (command === "lifecycle_result" && args.saved === true) {
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
            command === "desktop_ai_queue" &&
            call.kind === "accept" &&
            response.headers.get("Tauri-Response") === "ok"
          )
            state.accepted.push((await response.clone().json()).queue);
          return response;
        };
      });
      await session.browser.$('button[aria-label="Open Chat"]').click();
      await send("held-first");
      await session.browser.waitUntil(
        async () =>
          fixture.commands().filter((frame) => frame.type === "prompt")
            .length === 1,
        { timeout: 30000 },
      );
      await send("held-queued");
      await send("Cancel through the native pointer");
      const queue = session.browser.$('[aria-label="Queued messages"]');
      await session.browser.waitUntil(
        async () => (await queue.$$("article")).length === 2,
      );
      const cancelCard = (await queue.$$("article"))[1];
      const cancelButton = await cancelCard.$(
        'button[aria-label="Cancel queued message for Codex"]',
      );
      // WKWebView's driver moveTo does not establish CSS :hover. The public
      // focus path reveals actions; the following hit-test and click stay native.
      await session.browser.execute((button) => button.focus(), cancelButton);
      assert.equal(await cancelButton.isFocused(), true);
      await session.browser.waitUntil(() =>
        session.browser.execute(() => {
          const card = [
            ...document.querySelectorAll(
              '[aria-label="Queued messages"] article',
            ),
          ].find((node) =>
            node.textContent.includes("Cancel through the native pointer"),
          );
          const button = card?.querySelector(
            'button[aria-label="Cancel queued message for Codex"]',
          );
          if (!button) return false;
          const rect = button.getBoundingClientRect();
          const hit = document.elementFromPoint(
            rect.x + rect.width / 2,
            rect.y + rect.height / 2,
          );
          return (
            getComputedStyle(button).pointerEvents === "auto" &&
            button.contains(hit)
          );
        }),
      );
      await cancelButton.click();
      await session.browser.waitUntil(
        async () =>
          !(await queue.getText()).includes(
            "Cancel through the native pointer",
          ),
      );
      assert.equal(
        fixture.commands().filter((frame) => frame.type === "prompt").length,
        1,
      );
      await session.browser
        .$("button=Pause queue")
        .waitForDisplayed({ timeout: 30000 });
      await session.browser.$("button=Pause queue").click();
      fixture.release();
      await session.browser
        .$("button=Resume queue")
        .waitForDisplayed({ timeout: 30000 });
      await session.browser.$("button=Resume queue").click();
      await session.browser.waitUntil(
        async () =>
          fixture.commands().filter((frame) => frame.type === "prompt")
            .length === 2,
        { timeout: 30000 },
      );
      await send("Captured before ordinary reload");
      await session.browser.waitUntil(
        async () => (await audit()).accepted.length === 3,
        { timeout: 30000 },
      );
      const accepted = (await audit()).accepted[2];
      assert.equal(accepted.entries[1].phase, "cancelled");
      const captured = accepted.entries[2].input.capture;
      assert.equal(captured.user.text, "Captured before ordinary reload");
      assert.equal(captured.selection.targets[0].executionMode, "read-only");
      held = true;
      await reloadNotes(session.browser);
      await session.browser.waitUntil(async () => (await audit()).held, {
        timeout: 30000,
      });
      const detached = await audit();
      assert.equal(
        await session.browser.$('[data-notes-ready="true"]').isExisting(),
        false,
      );
      for (const command of ["desktop_ai_release", "vault_close"])
        assert.ok(
          detached.calls.some(
            (call) =>
              call.command === command && call.finished <= detached.heldAt,
          ),
        );
      fixture.releaseQueued();
      const transcript = join(
        fixture.vault,
        ".lapis/agents/sessions",
        accepted.conversation_id,
        "transcript.jsonl",
      );
      const entries = () =>
        readFileSync(transcript, "utf8")
          .trim()
          .split("\n")
          .filter(Boolean)
          .map(JSON.parse);
      const deadline = Date.now() + 30000;
      while (
        !entries().some(
          (entry) =>
            entry.type === "queue.outcome" &&
            entry.parentId === captured.user.id,
        ) &&
        Date.now() < deadline
      )
        await delay(100);
      assert.deepEqual(
        entries().find((entry) => entry.id === captured.user.id),
        captured.user,
      );
      assert.equal(
        entries().filter(
          (entry) =>
            entry.type === "queue.outcome" &&
            entry.parentId === captured.user.id,
        ).length,
        1,
      );
      const completedAudit = await audit();
      assert.equal(
        completedAudit.calls.filter(
          (call) =>
            ["desktop_ai_turn", "desktop_ai_queue"].includes(call.command) &&
            call.at >= detached.heldAt,
        ).length,
        0,
      );
      assert.equal(
        fixture.commands().filter((frame) => frame.type === "prompt").length,
        3,
      );
      await releaseReload();
      await session.browser
        .$('[data-notes-ready="true"]')
        .waitForDisplayed({ timeout: 45000 });
      async function recover() {
        await session.browser
          .$('button[aria-label="Open Chat"]')
          .waitForDisplayed({ timeout: 30000 });
        await session.browser.$('button[aria-label="Open Chat"]').click();
        await session.browser
          .$('button[aria-label="Conversation actions"]')
          .waitForDisplayed();
        await session.browser
          .$('button[aria-label="Conversation actions"]')
          .click();
        await session.browser
          .$('//*[@role="menuitem" and normalize-space(.)="AI conversations"]')
          .click();
        const history = session.browser.$(
          '[data-testid="ai-conversation-history"]',
        );
        await history.waitForDisplayed();
        const row = history.$("button*=held-first");
        await row.waitForDisplayed({ timeout: 30000 });
        await row.click();
        await session.browser.waitUntil(
          async () =>
            (
              await session.browser
                .$('[data-native-chat="true"]:has([contenteditable="true"])')
                .getText()
            ).includes(captured.user.text),
          { timeout: 30000 },
        );
        assert.equal(
          entries().filter((entry) => entry.id === captured.user.id).length,
          1,
        );
        assert.equal(
          fixture.commands().filter((frame) => frame.type === "prompt").length,
          3,
        );
      }
      await recover();
      await session.close(true);
      await launch("native-queue-screen-cold", true);
      await recover();
      await session.close(true);
      console.log(`Native queue screen evidence: ${fixture.root}`);
    } catch (error) {
      const ui = await session?.browser
        .execute(() => ({
          text: document.body.innerText,
          buttons: [...document.querySelectorAll("button[aria-label]")].map(
            (node) => ({
              label: node.getAttribute("aria-label"),
              disabled: node.disabled,
              visible: node.getClientRects().length > 0,
            }),
          ),
          editors: [...document.querySelectorAll("[contenteditable]")].map(
            (node) => ({
              label: node.getAttribute("aria-label"),
              editable: node.getAttribute("contenteditable"),
              text: node.textContent,
            }),
          ),
          queue: [
            ...document.querySelectorAll(
              '[aria-label="Queued messages"] article',
            ),
          ].map((card) => {
            const button = card.querySelector(
              'button[aria-label^="Cancel queued"]',
            );
            const rect = button?.getBoundingClientRect();
            const hit =
              rect &&
              document.elementFromPoint(
                rect.x + rect.width / 2,
                rect.y + rect.height / 2,
              );
            return {
              text: card.textContent,
              hovered: card.matches(":hover"),
              button: button && {
                pointer: getComputedStyle(button).pointerEvents,
                rect: rect.toJSON(),
              },
              hit: hit && {
                tag: hit.tagName,
                label: hit.getAttribute("aria-label"),
                className: hit.getAttribute("class"),
              },
            };
          }),
        }))
        .catch(String);
      writeFileSync(
        join(fixture.root, "screen-failure.json"),
        JSON.stringify(
          {
            error: String(error.stack ?? error),
            ui,
            audit: await audit().catch(String),
          },
          null,
          2,
        ),
      );
      console.error(`Native queue screen diagnostics: ${fixture.root}`);
      throw error;
    } finally {
      if (session?.isRunning()) {
        fixture.release();
        fixture.releaseQueued();
        if (held) await releaseReload().catch(() => {});
        await session.cleanup();
      }
    }
  },
);
