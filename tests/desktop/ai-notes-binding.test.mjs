import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
} from "node:fs";
import { resolve, join } from "node:path";
import { nativeSession } from "./native-session.mjs";
import { acceptanceBinary } from "../../scripts/native-acceptance-binary.mjs";
import { seedRetiredAi } from "./ai-retirement-fixture.mjs";
import { normalRecovery } from "../../src/lib/notes/startup-recovery.ts";
process.env.LAPIS_DESKTOP_ACCEPTANCE_NATIVE_AI = "1";
const executable = resolve(
  "src-tauri/target/debug/bundle/macos/Lapis Notes Acceptance.app/Contents/MacOS/lapis-desktop",
);
function binary() {
  return acceptanceBinary(executable, ["LAPIS_DESKTOP_ACCEPTANCE_NATIVE_AI"]);
}
async function ready(session) {
  await session.browser.$('[data-notes-ready="true"]').waitForDisplayed();
}
async function info(session) {
  const value = await session.browser.execute(() =>
    globalThis.__TAURI__.core.invoke("shell_info"),
  );
  assert.equal(
    value.nativeAiPolicy,
    true,
    "Use the actual native admission policy, never the transport fixture policy.",
  );
  assert.equal(value.backgroundApi, false);
}
async function unavailable(session) {
  const panel = session.browser.$('[data-testid="ai-chat-panel"]');
  await panel.waitForDisplayed();
  await session.browser.waitUntil(async () =>
    (await panel.getText()).includes("Configure an admitted agent"),
  );
  assert.deepEqual(
    await session.browser.execute(() =>
      globalThis.__TAURI__.core.invoke("plugin:lapis-ai|targets"),
    ),
    [],
  );
  assert.deepEqual(
    await session.browser.execute(() =>
      globalThis.__TAURI__.core.invoke("plugin:lapis-ai|list"),
    ),
    [],
  );
}
function fixture(name) {
  const parent = resolve(
    process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT ?? ".local/native-test",
  );
  mkdirSync(parent, { recursive: true });
  const root = mkdtempSync(join(parent, name));
  const vault = join(root, "AI 笔记");
  mkdirSync(vault);
  writeFileSync(join(vault, "Welcome.md"), "# Native AI binding\n");
  return { root, vault };
}
test("Notes binds real native AI services, preserves global commands and restores its unavailable view cold", async (context) => {
  const artifact = binary();
  const { root, vault } = fixture("ai-notes-");
  const commands = join(root, ".lapis/agents/commands");
  mkdirSync(commands, { recursive: true });
  const help =
    "---\ndescription: My existing help\n---\n\nPreserve this user command.\n";
  writeFileSync(join(commands, "help.md"), help);
  const session = await nativeSession("ai-notes", root, artifact);
  context.after(session.cleanup);
  await info(session);
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  await session.browser.$("button*=Open Vault").click();
  await ready(session);
  await session.browser.$('button[aria-label="Open Chat"]').click();
  await unavailable(session);
  assert.equal(readFileSync(join(commands, "help.md"), "utf8"), help);
  assert.ok(readdirSync(join(vault, ".agents/skills")).length > 0);
  assert.equal(
    existsSync(join(root, "acp-peer.jsonl")),
    false,
    "No provider is fabricated for an unavailable target.",
  );
  await session.close();
  const cold = await nativeSession("ai-notes-cold", root, artifact);
  context.after(cold.cleanup);
  await info(cold);
  await ready(cold);
  await unavailable(cold);
  assert.equal(readFileSync(join(commands, "help.md"), "utf8"), help);
  assert.equal(
    readFileSync(join(vault, "Welcome.md"), "utf8"),
    "# Native AI binding\n",
  );
  await cold.close();
  console.log(`Native AI Notes evidence: ${root}`);
});
test("disabled bundled AI starts Notes without native command IO or a Chat action", async (context) => {
  const artifact = binary();
  const { root, vault } = fixture("ai-notes-disabled-");
  mkdirSync(join(vault, ".lapis"));
  writeFileSync(
    join(vault, ".lapis/core-plugins.json"),
    JSON.stringify({ disabled: ["ai"], enabled: [] }),
  );
  const session = await nativeSession("ai-notes-disabled", root, artifact);
  context.after(session.cleanup);
  await info(session);
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  await session.browser.$("button*=Open Vault").click();
  await ready(session);
  assert.equal(
    await session.browser.$('button[aria-label="Open Chat"]').isExisting(),
    false,
  );
  assert.equal(existsSync(join(root, ".lapis/agents/commands")), false);
  assert.equal(existsSync(join(vault, ".agents/skills")), false);
  await session.close();
  console.log(`Disabled AI Notes evidence: ${root}`);
});

for (const disabledBy of [undefined, "installed", "app-shell"]) {
  test(`retired external AI stays inert and its data survives bundled startup and cold reopen: ${disabledBy ?? "enabled"}`, async (context) => {
    const artifact = binary();
    const { root, vault } = fixture("ai-retirement-");
    const unchanged = seedRetiredAi(vault, disabledBy);
    for (const cold of [false, true]) {
      const session = await nativeSession(
        `ai-retirement-${disabledBy ?? "enabled"}-${cold ? "cold" : "first"}`,
        root,
        artifact,
      );
      context.after(session.cleanup);
      await info(session);
      if (!cold) {
        writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
        await session.browser.$("button*=Open Vault").click();
      }
      await ready(session);
      assert.equal(
        await session.browser.execute(() =>
          Boolean(globalThis.__retiredSharedAiEvaluated),
        ),
        false,
        "Bundled precedence must prevent external module evaluation",
      );
      const chat = session.browser.$('button[aria-label="Open Chat"]');
      assert.equal(await chat.isExisting(), disabledBy === undefined);
      if (disabledBy === undefined) {
        await chat.click();
        await unavailable(session);
        const retained = JSON.parse(
          readFileSync(join(vault, ".lapis/app.json"), "utf8"),
        ).pluginData.ai;
        assert.deepEqual(retained.sessions, [
          { id: "legacy-controller-session", runtimeSessionId: "old" },
        ]);
        assert.deepEqual(retained.futureValue, { keep: true });
        assert.equal(retained.settings.defaultRuntime, "fake");
      } else {
        assert.equal(existsSync(join(root, ".lapis/agents/commands")), false);
        assert.equal(existsSync(join(vault, ".agents/skills")), false);
      }
      unchanged();
      await session.close();
      unchanged();
      assert.equal(existsSync(join(root, "acp-peer.jsonl")), false);
    }
    console.log(`Retired AI preservation evidence: ${root}`);
  });
}

test("Safe Mode suppresses bundled and retired AI without changing saved data, then cold startup enables only bundled AI", async (context) => {
  const artifact = binary();
  const { root, vault } = fixture("ai-retirement-safe-");
  const unchanged = seedRetiredAi(vault);
  const session = await nativeSession("ai-retirement-safe", root, artifact);
  context.after(session.cleanup);
  await info(session);
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  // Admit only long enough to obtain this disposable profile's identity. The
  // production Shell has not opened a Notes App or allocated its AI services.
  const profileId = await session.browser.execute(async () => {
    const selected = await globalThis.__TAURI__.core.invoke("vault_select", {
      createName: null,
    });
    await globalThis.__TAURI__.core.invoke("vault_close", {
      sessionId: selected.sessionId,
    });
    return selected.profileId;
  });
  await session.browser.execute(
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
  await session.browser.$("button*=Open Vault").click();
  await ready(session);
  await session.browser.$('[aria-label="Safe Mode"]').waitForDisplayed();
  assert.equal(
    await session.browser.$('button[aria-label="Open Chat"]').isExisting(),
    false,
  );
  assert.equal(
    await session.browser.execute(() =>
      Boolean(globalThis.__retiredSharedAiEvaluated),
    ),
    false,
  );
  assert.equal(existsSync(join(root, ".lapis/agents/commands")), false);
  assert.equal(existsSync(join(vault, ".agents/skills")), false);
  unchanged();
  await session.close();
  unchanged();
  const cold = await nativeSession("ai-retirement-after-safe", root, artifact);
  context.after(cold.cleanup);
  await info(cold);
  await ready(cold);
  assert.equal(
    await cold.browser.$('[aria-label="Safe Mode"]').isExisting(),
    false,
  );
  await cold.browser.$('button[aria-label="Open Chat"]').click();
  await unavailable(cold);
  assert.equal(
    await cold.browser.execute(() =>
      Boolean(globalThis.__retiredSharedAiEvaluated),
    ),
    false,
  );
  unchanged();
  await cold.close();
  unchanged();
  assert.equal(existsSync(join(root, "acp-peer.jsonl")), false);
  console.log(`Safe Mode retired AI preservation evidence: ${root}`);
});
