import { Key } from "webdriverio";
import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { randomUUID } from "node:crypto";
import { nativeSession } from "./native-session.mjs";

test(
  "native client installation retains its receipt, prepares bundled ACP and starts a vault shell",
  { timeout: 240000, skip: process.env.LAPIS_AI_CLIENT_INSTALL_TEST !== "1" },
  async (context) => {
    const parent = resolve(".local/native-test");
    mkdirSync(parent, { recursive: true });
    const root = mkdtempSync(join(parent, "client-tooling-"));
    const vault = join(root, "Vault");
    mkdirSync(join(root, "profile"));
    mkdirSync(join(vault, ".lapis"), { recursive: true });
    writeFileSync(
      join(root, "profile/ai-runtime.json"),
      JSON.stringify({
        version: 1,
        bundle: resolve("src-tauri/resources/lapis-ai"),
      }),
    );
    writeFileSync(
      join(vault, ".lapis/terminal.json"),
      JSON.stringify({ shell: "/bin/sh", cwd: "" }),
    );
    writeFileSync(join(vault, "Note.md"), "# Note\n\nvaultcurrentprobe\n");
    writeFileSync(
      join(vault, ".lapis/hotkeys.json"),
      JSON.stringify({ "search:open-search": [{ key: "F6", modifiers: [] }] }),
    );
    writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
    const session = await nativeSession("client-tooling", root, undefined, [], {
      background: true,
    });
    context.after(session.cleanup);
    const call = async (command, args = {}) => {
      const id = randomUUID();
      await session.browser.execute(
        (id, command, args) => {
          globalThis.__clientToolingJobs ??= {};
          const jobs = globalThis.__clientToolingJobs;
          jobs[id] = { pending: true };
          void globalThis.__TAURI__.core.invoke(command, args).then(
            (value) => (jobs[id] = { value }),
            (error) => (jobs[id] = { error: String(error?.message ?? error) }),
          );
        },
        id,
        command,
        args,
      );
      await session.browser.waitUntil(
        () =>
          session.browser.execute(
            (id) => !globalThis.__clientToolingJobs[id].pending,
            id,
          ),
        { timeout: 60000, interval: 100 },
      );
      const result = await session.browser.execute((id) => {
        const value = globalThis.__clientToolingJobs[id];
        delete globalThis.__clientToolingJobs[id];
        return value;
      }, id);
      if (result.error) throw new Error(`${command}: ${result.error}`);
      return result.value;
    };
    const descriptor = await call("vault_select");
    const clients = (action) =>
      call("desktop_ai_clients", {
        request: { sessionId: descriptor.sessionId, action },
      });
    const status = await clients({ type: "status" });
    assert.equal(status.install_supported, true, status.install_unavailable);
    const request = randomUUID().replaceAll("-", "");
    await clients({ type: "install", request });
    let outcome;
    await session.browser.waitUntil(
      async () => {
        outcome = await clients({ type: "outcome", request });
        return outcome.state !== "installing";
      },
      { timeout: 150000, interval: 1000 },
    );
    assert.equal(outcome.state, "completed", outcome.error);
    assert.equal(
      (await clients({ type: "install", request })).request_id,
      request,
    );
    const installed = (await clients({ type: "status" })).runtimes.find(
      (v) => v.id === "codex",
    );
    assert.equal(installed.managed, true);
    assert.equal(installed.adapter_version, "1.13.1");
    assert.equal(installed.cli_version, "0.156.1");
    await call("desktop_ai_admit", {
      request: { sessionId: descriptor.sessionId },
    });
    assert.ok(
      (await call("plugin:lapis-ai|targets")).some(
        (value) => value.id === "codex",
      ),
    );
    // A model/catalog handshake sends no prompt.
    const agent = await call("plugin:lapis-ai|open", {
      requestId: randomUUID(),
      targetId: "codex",
    });
    assert.ok(agent.sessionId);
    await call("plugin:lapis-ai|close", { sessionId: agent.sessionId });
    await call("desktop_terminal_admit", { sessionId: descriptor.sessionId });
    assert.equal((await call("plugin:lapis-terminal|list")).length, 0);
    const shell = await call("plugin:lapis-terminal|open", {
      requestId: randomUUID(),
      targetId: "vault-shell",
      columns: 80,
      rows: 24,
    });
    await call("plugin:lapis-terminal|input", {
      sessionId: shell.id,
      data: "printf ready > terminal-ready.txt\r",
    });
    await session.browser.waitUntil(
      () => {
        try {
          return (
            readFileSync(join(vault, "terminal-ready.txt"), "utf8") === "ready"
          );
        } catch {
          return false;
        }
      },
      { timeout: 10000 },
    );
    await call("plugin:lapis-terminal|close", { sessionId: shell.id });
    await call("desktop_ai_release", { request: { reload: false } });
    await call("desktop_terminal_release", { reload: false });
    await call("vault_close", { sessionId: descriptor.sessionId });
    writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
    await session.browser.$("button*=Open Vault").click();
    await session.browser
      .$('[data-notes-ready="true"]')
      .waitForDisplayed({ timeout: 45000 });
    await session.browser.keys(Key.F6);
    const panel = '[data-testid="search-panel"]';
    await session.browser.$(panel).waitForDisplayed({ timeout: 15000 });
    await session.browser
      .$(`${panel} .cm-content[contenteditable="true"]`)
      .addValue("vaultcurrentprobe");
    await session.browser
      .$(`${panel} [aria-level="1"][aria-label*="Note.md,"]`)
      .waitForDisplayed({ timeout: 15000 });
    const bounds = await session.browser.execute(() => {
      const panel = document.querySelector('[data-testid="search-panel"]');
      const row = panel.querySelector(
        '[aria-level="1"][aria-label*="Note.md,"]',
      );
      const viewport = panel.querySelector(
        '.search-panel__scroll-area > [data-ui-part="scroll-area-viewport"]',
      );
      return {
        row: row.getBoundingClientRect().toJSON(),
        viewport: viewport.getBoundingClientRect().toJSON(),
      };
    });
    assert.ok(bounds.viewport.height > 40 && bounds.row.height > 0);
    assert.ok(
      bounds.row.top >= bounds.viewport.top &&
        bounds.row.bottom <= bounds.viewport.bottom,
    );
    await session.close();
    const restarted = await nativeSession(
      "client-tooling-reopen",
      root,
      undefined,
      [],
      { background: true },
    );
    context.after(restarted.cleanup);
    const receipt = JSON.parse(
      readFileSync(join(root, "profile/ai-clients/state.json"), "utf8"),
    );
    assert.equal(receipt.selected, request);
    assert.equal(receipt.requests[request].state, "completed");
    await restarted.close();
  },
);
