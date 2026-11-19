import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { nativeSession } from "./native-session.mjs";
import { nativeTurnFixture } from "./native-turn-fixture.mjs";
import { seedRetiredAi } from "./ai-retirement-fixture.mjs";
import { normalRecovery } from "../../src/lib/notes/startup-recovery.ts";

function selectCoreOwner(context) {
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
}

async function startCore(context, name, fixture, cold = false) {
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

async function submitNativeTurn(session, text) {
  await session.browser.$('button[aria-label="Open Chat"]').click();
  const composer = session.browser.$(
    '[contenteditable="true"][aria-label="Message"]',
  );
  await composer.waitForDisplayed();
  await composer.addValue(text);
  await session.browser
    .$('button[aria-label="Send message"]')
    .waitForEnabled({ timeout: 30000 });
  await session.browser.$('button[aria-label="Send message"]').click();
  await session.browser.waitUntil(
    async () =>
      (await session.browser.$('[data-native-chat="true"]').getText()).includes(
        "reply café 📝",
      ),
    { timeout: 30000 },
  );
}

async function assertRetiredModuleStayedInert(session, fixtureKind) {
  if (fixtureKind !== "synthetic") return;
  assert.equal(
    await session.browser.execute(() =>
      Boolean(globalThis.__retiredSharedAiEvaluated),
    ),
    false,
    "Bundled App Profile AI must prevent external module evaluation",
  );
}

function promptCount(fixture) {
  if (!existsSync(fixture.log)) return 0;
  return readFileSync(fixture.log, "utf8")
    .split("\n")
    .filter(Boolean)
    .map(JSON.parse)
    .filter((frame) => frame.type === "prompt").length;
}

describe("App Profile native chat", { concurrency: false }, () => {
  test(
    "Core chat retains sidebar History and exact conversation through a cold native restart without replay",
    { timeout: 120000 },
    async (context) => {
      selectCoreOwner(context);
      const fixture = nativeTurnFixture();
      const first = await startCore(context, "core-chat", fixture);
      await submitNativeTurn(first, "A native Tauri conversation");
      await first.browser
        .$('button[aria-label="Conversation actions"]')
        .click();
      await first.browser
        .$('//*[@role="menuitem" and normalize-space(.)="AI conversations"]')
        .click();
      const history = first.browser.$(
        '[data-testid="ai-conversation-history"]',
      );
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
      const cold = await startCore(context, "core-chat-cold", fixture, true);
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
      assert.equal(promptCount(fixture), 1);
      await cold.close(true);
      console.log(`Native Core chat evidence: ${fixture.root}`);
    },
  );

  for (const fixtureKind of ["synthetic", "historical"]) {
    test(
      `App Profile chat keeps retired external AI inert and preserves its data through a native turn and cold reopen: ${fixtureKind}`,
      { timeout: 120000 },
      async (context) => {
        selectCoreOwner(context);
        const fixture = nativeTurnFixture();
        const unchanged = seedRetiredAi(fixture.vault, undefined, fixtureKind);
        const first = await startCore(
          context,
          `core-retired-${fixtureKind}`,
          fixture,
        );
        await assertRetiredModuleStayedInert(first, fixtureKind);
        await submitNativeTurn(first, `Preserve retired ${fixtureKind} data`);
        unchanged();
        await first.close(true);
        unchanged();

        const cold = await startCore(
          context,
          `core-retired-${fixtureKind}-cold`,
          fixture,
          true,
        );
        await assertRetiredModuleStayedInert(cold, fixtureKind);
        const restored = cold.browser.$('[data-native-chat="true"]');
        if (!(await restored.isExisting()))
          await cold.browser.$('button[aria-label="Open Chat"]').click();
        await restored.waitForDisplayed({ timeout: 30000 });
        unchanged();
        assert.equal(promptCount(fixture), 1, "Cold restore must not replay");
        await cold.close(true);
        unchanged();
      },
    );

    test(
      `App Profile Safe Mode suppresses retired and bundled AI, preserves old data, then cold startup enables only bundled AI: ${fixtureKind}`,
      { timeout: 120000 },
      async (context) => {
        selectCoreOwner(context);
        const fixture = nativeTurnFixture();
        const unchanged = seedRetiredAi(fixture.vault, undefined, fixtureKind);
        const safe = await nativeSession(
          `core-retired-safe-${fixtureKind}`,
          fixture.root,
          undefined,
          [],
          { background: false },
        );
        context.after(safe.cleanup);
        const profileId = await safe.browser.execute(async () => {
          const selected = await globalThis.__TAURI__.core.invoke(
            "vault_select",
            {
              createName: null,
            },
          );
          await globalThis.__TAURI__.core.invoke("vault_close", {
            sessionId: selected.sessionId,
          });
          return selected.profileId;
        });
        writeFileSync(
          join(fixture.root, "picker.json"),
          JSON.stringify(fixture.vault),
        );
        await safe.browser.execute(
          (id, recovery) => {
            sessionStorage.setItem(
              `lapis.safeMode.session:${id}`,
              JSON.stringify(recovery),
            );
          },
          profileId,
          {
            ...normalRecovery(),
            active: true,
            disableCommunityPlugins: true,
            disableOptionalCorePlugins: true,
            skipLayoutRestore: true,
          },
        );
        await safe.browser.$("button*=Open Vault").click();
        await safe.browser
          .$('[data-notes-ready="true"]')
          .waitForDisplayed({ timeout: 45000 });
        await safe.browser.$('[aria-label="Safe Mode"]').waitForDisplayed();
        assert.equal(
          await safe.browser.$('button[aria-label="Open Chat"]').isExisting(),
          false,
        );
        await assertRetiredModuleStayedInert(safe, fixtureKind);
        assert.equal(promptCount(fixture), 0, "Safe Mode must not start ACP");
        unchanged();
        await safe.close(true);
        unchanged();

        const cold = await startCore(
          context,
          `core-retired-after-safe-${fixtureKind}`,
          fixture,
          true,
        );
        assert.equal(
          await cold.browser.$('[aria-label="Safe Mode"]').isExisting(),
          false,
        );
        await assertRetiredModuleStayedInert(cold, fixtureKind);
        await submitNativeTurn(cold, `Resume bundled AI after ${fixtureKind}`);
        unchanged();
        assert.equal(promptCount(fixture), 1);
        await cold.close(true);
        unchanged();
      },
    );
  }
});
