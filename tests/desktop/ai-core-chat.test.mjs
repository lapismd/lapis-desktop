import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { nativeSession } from "./native-session.mjs";
import { nativeTurnFixture } from "./native-turn-fixture.mjs";

test(
  "Core chat retains sidebar History and exact conversation through a cold native restart without replay",
  { timeout: 120000 },
  async (context) => {
    const previous = {
      owner: process.env.LAPIS_DESKTOP_AI_OWNER,
      policy: process.env.LAPIS_DESKTOP_ACCEPTANCE_NATIVE_AI,
    };
    process.env.LAPIS_DESKTOP_AI_OWNER = "core";
    process.env.LAPIS_DESKTOP_ACCEPTANCE_NATIVE_AI = "1";
    context.after(() => {
      for (const [key, value] of [
        ["LAPIS_DESKTOP_AI_OWNER", previous.owner],
        ["LAPIS_DESKTOP_ACCEPTANCE_NATIVE_AI", previous.policy],
      ])
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
    });
    const fixture = nativeTurnFixture();
    async function start(name, cold = false) {
      const session = await nativeSession(name, fixture.root, undefined, [], {
        background: false,
      });
      context.after(session.cleanup);
      if (!cold) await session.browser.$("button*=Open Vault").click();
      await session.browser
        .$('[data-notes-ready="true"]')
        .waitForDisplayed({ timeout: 45000 });
      return session;
    }
    const first = await start("core-chat");
    await first.browser.$('button[aria-label="Open Chat"]').click();
    const composer = first.browser.$(
      '[contenteditable="true"][aria-label="Message"]',
    );
    await composer.waitForDisplayed();
    await composer.addValue("A native Tauri conversation");
    await first.browser
      .$('button[aria-label="Send message"]')
      .waitForEnabled({ timeout: 30000 });
    await first.browser.$('button[aria-label="Send message"]').click();
    await first.browser.waitUntil(
      async () =>
        (await first.browser.$('[data-native-chat="true"]').getText()).includes(
          "reply café 📝",
        ),
      { timeout: 30000 },
    );
    await first.browser.$('button[aria-label="Conversation actions"]').click();
    await first.browser
      .$('//*[@role="menuitem" and normalize-space(.)="AI conversations"]')
      .click();
    const history = first.browser.$('[data-testid="ai-conversation-history"]');
    await history.waitForDisplayed();
    assert.equal(
      await first.browser.execute(
        () =>
          document
            .querySelector('[data-testid="ai-conversation-history"]')
            .closest("[data-workspace-surface]").dataset.workspaceSurface,
      ),
      "right-sidebar",
    );
    await history.$("button*=A native Tauri conversation").click();
    assert.equal(await history.isDisplayed(), true);
    assert.equal(
      (
        await first.browser
          .$('[role=toolbar][aria-label="Workspace tabs"]')
          .$$("button=AI")
      ).length,
      1,
    );
    await first.close(true);
    const cold = await start("core-chat-cold", true);
    await cold.browser
      .$('[data-testid="ai-conversation-history"]')
      .waitForDisplayed();
    await cold.browser
      .$('[data-testid="ai-conversation-history"]')
      .$("button*=A native Tauri conversation")
      .click();
    await cold.browser.waitUntil(async () =>
      (
        await cold.browser
          .$('[data-native-chat="true"]:has([contenteditable="true"])')
          .getText()
      ).includes("reply café 📝"),
    );
    assert.equal(
      (
        await cold.browser
          .$('[role=toolbar][aria-label="Workspace tabs"]')
          .$$("button=AI")
      ).length,
      1,
    );
    assert.equal(
      readFileSync(fixture.log, "utf8")
        .split("\n")
        .filter(Boolean)
        .map(JSON.parse)
        .filter((frame) => frame.type === "prompt").length,
      1,
    );
    await cold.close(true);
    console.log(`Native Core chat evidence: ${fixture.root}`);
  },
);
