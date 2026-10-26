import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  chmodSync,
  renameSync,
  rmSync,
} from "node:fs";
import { join } from "node:path";
import { TERMINAL_CELL_METRICS } from "@lapismd/terminal";
import { nativeSession } from "./native-session.mjs";
import { reloadNotes, returnToVaults } from "./workspace-navigation.mjs";
import { nativeFailure } from "./conflict-review.mjs";

function fixture(name, settings = { shell: "/bin/sh", cwd: "" }) {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, `${name}-`),
  );
  const vault = join(root, "Terminal café");
  mkdirSync(join(vault, ".lapis"), { recursive: true });
  writeFileSync(join(vault, "Note.md"), "# A note\n");
  writeFileSync(join(vault, ".lapis/terminal.json"), JSON.stringify(settings));
  return { root, vault };
}
async function choose(session, root, vault) {
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  await session.browser.$("button*=Open Vault").click();
  await session.browser.$('[data-notes-ready="true"]').waitForDisplayed();
}
async function list(session) {
  return session.browser.execute(() =>
    globalThis.__TAURI__.core.invoke("plugin:lapis-terminal|list"),
  );
}
async function open(session) {
  await session.browser.$('button[aria-label="Open Terminal"]').click();
  await session.browser.$('[aria-label="Terminal input"]').waitForExist();
  await session.browser.waitUntil(async () => (await list(session)).length > 0);
  const [info] = await list(session);
  await output(session, "$");
  return info;
}
async function send(session, data) {
  await session.browser.execute((data) => {
    const input = document.querySelector('[aria-label="Terminal input"]');
    input.focus();
    input.value = data;
    input.dispatchEvent(new InputEvent("input", { bubbles: true, data }));
  }, data);
}
async function output(session, expected) {
  try {
    await session.browser.waitUntil(
      () =>
        session.browser.execute(
          (expected) =>
            document
              .querySelector('[aria-label="Terminal output"]')
              ?.textContent.includes(expected),
          expected,
        ),
      {
        timeout: 10000,
        timeoutMsg: `Terminal output must include ${expected}`,
      },
    );
  } catch (error) {
    console.error(
      "Terminal acceptance state",
      await session.browser.execute(async () => {
        let sessions;
        try {
          sessions = await globalThis.__TAURI__.core.invoke(
            "plugin:lapis-terminal|list",
          );
        } catch (failure) {
          sessions = String(failure);
        }
        return { text: document.body.innerText, sessions };
      }),
    );
    throw error;
  }
}
async function fileContent(session, path) {
  let value;
  await session.browser.waitUntil(
    () => {
      try {
        value = readFileSync(path, "utf8").trim();
        return Boolean(value);
      } catch {
        return false;
      }
    },
    { timeout: 10000, timeoutMsg: "Shell output file must settle: " + path },
  );
  return value;
}
async function stopped(session, pid) {
  await session.browser.waitUntil(
    () => {
      try {
        process.kill(pid, 0);
        return false;
      } catch (error) {
        assert.equal(error.code, "ESRCH");
        return true;
      }
    },
    { timeout: 5000, timeoutMsg: "The owned shell must terminate" },
  );
}
async function viewport(session) {
  return session.browser.execute((metrics) => {
    const rect = document.querySelector(".lt-viewport").getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      rows: Math.max(
        1,
        Math.min(200, Math.floor(rect.height / metrics.height)),
      ),
      columns: Math.max(
        2,
        Math.min(512, Math.floor(rect.width / metrics.width)),
      ),
    };
  }, TERMINAL_CELL_METRICS);
}
async function closeTab(session, remaining = 0) {
  await session.browser.execute(() => {
    const tab = Array.from(
      document.querySelectorAll('button[role="tab"]'),
    ).find((node) => node.textContent.trim() === "Terminal");
    const rect = tab.getBoundingClientRect();
    tab.dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        button: 2,
        clientX: rect.left + 15,
        clientY: rect.top + 10,
      }),
    );
  });
  const close = session.browser.$('[role="menuitem"]=Close');
  await close.waitForDisplayed();
  await close.click();
  await session.browser.waitUntil(
    async () => (await list(session)).length === remaining,
  );
}
async function toggle(session) {
  await session.browser.$('button[aria-label="Open settings"]').click();
  await session.browser.$("button=Core plugins").click();
  const control = session.browser.$(
    '[data-settings-plugin-id="terminal"] [role="switch"]',
  );
  await control.waitForDisplayed();
  return control;
}

test("cold Terminal input, viewport resize, hide and renderer reload retain one native shell; restart awaits Start", async (context) => {
  const { root, vault } = fixture("terminal-reload");
  const session = await nativeSession("terminal-first", root);
  context.after(session.cleanup);
  await choose(session, root, vault);
  const info = await open(session);
  assert.equal(
    JSON.parse(readFileSync(join(vault, ".lapis/terminal.json"), "utf8")).shell,
    "/bin/sh",
  );
  await send(session, "printf 'NATIVE-café-你好\\n'\r");
  await output(session, "NATIVE-café-你好");
  await send(session, "printf '%s' $$ > terminal.pid\r");
  await session.browser.waitUntil(async () => {
    try {
      return Number(readFileSync(join(vault, "terminal.pid"), "utf8")) > 0;
    } catch {
      return false;
    }
  });
  const pid = Number(readFileSync(join(vault, "terminal.pid"), "utf8"));
  await session.browser.$('button[aria-label="Close bottom panel"]').click();
  assert.equal((await list(session))[0].id, info.id);
  await session.browser.$('button[aria-label="Open bottom panel"]').click();
  await output(session, "NATIVE-café-你好");
  const initialViewport = await viewport(session);
  await session.browser.execute(() =>
    globalThis.__TAURI__.window
      .getCurrentWindow()
      .setSize(new globalThis.__TAURI__.dpi.LogicalSize(840, 620)),
  );
  await session.browser.waitUntil(
    async () => (await viewport(session)).width !== initialViewport.width,
  );
  const expectedViewport = await viewport(session);
  const sizePath = join(vault, "viewport-size.txt");
  await session.browser.waitUntil(
    async () => {
      await send(session, "stty size > viewport-size.txt\r");
      try {
        const [rows, columns] = readFileSync(sizePath, "utf8")
          .trim()
          .split(/\s+/)
          .map(Number);
        return (
          rows === expectedViewport.rows && columns === expectedViewport.columns
        );
      } catch {
        return false;
      }
    },
    {
      timeout: 10000,
      timeoutMsg: "Native PTY dimensions must follow the rendered viewport",
    },
  );
  await send(session, "printf 'BEFORE-RELOAD\\n'\r");
  await output(session, "BEFORE-RELOAD");
  await reloadNotes(session.browser);
  await session.browser.$('[data-notes-ready="true"]').waitForDisplayed();
  await output(session, "BEFORE-RELOAD");
  assert.equal((await list(session))[0].id, info.id);
  await send(session, "printf 'AFTER-RELOAD\\n'\r");
  await output(session, "AFTER-RELOAD");
  await send(session, "printf '%s' $$ > after-reload.pid\r");
  assert.equal(
    Number(await fileContent(session, join(vault, "after-reload.pid"))),
    pid,
  );
  await session.close();
  await stopped(session, pid);
  const restored = await nativeSession("terminal-restarted", root);
  context.after(restored.cleanup);
  await restored.browser.$('[data-notes-ready="true"]').waitForDisplayed();
  await restored.browser.$("button=Start").waitForDisplayed();
  assert.deepEqual(await list(restored), []);
  await restored.browser.$("button=Start").click();
  await restored.browser.$('[aria-label="Terminal input"]').waitForExist();
  assert.notEqual((await list(restored))[0].id, info.id);
  await output(restored, "$");
  await send(restored, "printf '%s' $$ > restarted.pid\r");
  const restartedPid = Number(
    await fileContent(restored, join(vault, "restarted.pid")),
  );
  await closeTab(restored);
  await stopped(restored, restartedPid);
  await restored.close();
});

test("explicit terminal disable and vault return release only admitted shells; unsupported targets reject", async (context) => {
  const { root, vault } = fixture("terminal-disable");
  const session = await nativeSession("terminal-disable", root);
  context.after(session.cleanup);
  await choose(session, root, vault);
  await open(session);
  const additional = await session.browser.execute(() =>
    globalThis.__TAURI__.core.invoke("plugin:lapis-terminal|open", {
      targetId: "vault-shell",
      requestId: crypto.randomUUID(),
      columns: 80,
      rows: 24,
    }),
  );
  assert.equal((await list(session)).length, 2);
  await closeTab(session, 1);
  assert.equal((await list(session))[0].id, additional.id);
  await open(session);
  const denied = await session.browser.execute(async () => {
    try {
      await globalThis.__TAURI__.core.invoke("plugin:lapis-terminal|open", {
        targetId: "/bin/sh",
        requestId: crypto.randomUUID(),
        columns: 80,
        rows: 24,
      });
      return false;
    } catch {
      return true;
    }
  });
  assert.equal(denied, true);
  const control = await toggle(session);
  await control.click();
  await session.browser.waitUntil(
    async () => (await control.getAttribute("aria-checked")) === "false",
  );
  await session.browser.waitUntil(
    () =>
      session.browser.execute(async () => {
        try {
          await globalThis.__TAURI__.core.invoke("plugin:lapis-terminal|list");
          return false;
        } catch {
          return true;
        }
      }),
    {
      timeout: 10000,
      timeoutMsg: "Disabling Terminal must revoke its native admission",
    },
  );
  await control.click();
  await session.browser.keys("Escape");
  await session.browser.$('[aria-label="Open Terminal"]').click();
  const start = session.browser.$("button=Start");
  if (await start.isExisting()) await start.click();
  await session.browser.$('[aria-label="Terminal input"]').waitForExist();
  await returnToVaults(session.browser);
  await session.browser.$("button*=Open Vault").waitForDisplayed();
  const revoked = await session.browser.execute(async () => {
    try {
      await globalThis.__TAURI__.core.invoke("plugin:lapis-terminal|list");
      return false;
    } catch {
      return true;
    }
  });
  assert.equal(revoked, true);
  await session.close();
});

test("cancelled close retains the shell until guarded note persistence succeeds", async (context) => {
  const { root, vault } = fixture("terminal-cancel");
  const session = await nativeSession("terminal-cancel", root);
  context.after(session.cleanup);
  context.after(() => chmodSync(vault, 0o755));
  await choose(session, root, vault);
  const info = await open(session);
  await session.browser.$('[data-path="Note.md"]').click();
  const editor = session.browser.$('.cm-content[contenteditable="true"]');
  await editor.waitForDisplayed();
  chmodSync(vault, 0o555);
  await editor.click();
  await editor.addValue("unsaved-terminal-close");
  await session.requestClose();
  await session.browser.$(nativeFailure).waitForDisplayed();
  assert.equal((await list(session))[0].id, info.id);
  assert.equal(session.isRunning(), true);
  chmodSync(vault, 0o755);
  await session.close();
});

test("switching vaults revokes old handles and starts only inside the newly admitted root", async (context) => {
  const { root, vault } = fixture("terminal-isolation");
  const other = join(root, "Second vault");
  mkdirSync(join(other, ".lapis"), { recursive: true });
  writeFileSync(
    join(other, ".lapis/terminal.json"),
    '{"shell":"/bin/sh","cwd":""}',
  );
  const session = await nativeSession("terminal-isolation", root);
  context.after(session.cleanup);
  await choose(session, root, vault);
  const first = await open(session);
  await returnToVaults(session.browser);
  await session.browser.$("button*=Open Vault").waitForDisplayed();
  await choose(session, root, other);
  const second = await open(session);
  assert.notEqual(first.id, second.id);
  await send(session, "pwd > admitted-root.txt\r");
  await session.browser.waitUntil(async () => {
    try {
      return (
        readFileSync(join(other, "admitted-root.txt"), "utf8").trim() === other
      );
    } catch {
      return false;
    }
  });
  const stale = await session.browser.execute(async (id) => {
    try {
      await globalThis.__TAURI__.core.invoke("plugin:lapis-terminal|input", {
        sessionId: id,
        data: "touch wrong-root\r",
      });
      return false;
    } catch {
      return true;
    }
  }, first.id);
  assert.equal(stale, true);
  await session.close();
});

test("revoked physical vault admission stops its shell and permits a guarded cleanup retry", async (context) => {
  const { root, vault } = fixture("terminal-revoked");
  writeFileSync(
    join(vault, ".lapis/app.json"),
    JSON.stringify({ pluginData: { terminal: { shell: "/bin/sh", cwd: "" } } }),
  );
  const session = await nativeSession("terminal-revoked", root);
  context.after(session.cleanup);
  await choose(session, root, vault);
  const info = await open(session);
  await send(session, "printf '%s' $$ > terminal.pid\r");
  await session.browser.waitUntil(() => {
    try {
      return Number(readFileSync(join(vault, "terminal.pid"), "utf8")) > 0;
    } catch {
      return false;
    }
  });
  const pid = Number(readFileSync(join(vault, "terminal.pid"), "utf8"));
  const original = `${vault}-original`;
  renameSync(vault, original);
  mkdirSync(vault);
  try {
    assert.equal(
      await session.browser.execute(async (id) => {
        try {
          await globalThis.__TAURI__.core.invoke(
            "plugin:lapis-terminal|input",
            { sessionId: id, data: "must-not-run\r" },
          );
          return false;
        } catch {
          return true;
        }
      }, info.id),
      true,
    );
    await session.browser.waitUntil(
      () => {
        try {
          process.kill(pid, 0);
          return false;
        } catch {
          return true;
        }
      },
      {
        timeout: 5000,
        timeoutMsg: "Revocation must terminate the owned shell",
      },
    );
  } finally {
    rmSync(vault, { recursive: true });
    renameSync(original, vault);
  }
  await session.requestClose();
  await session.browser.$(nativeFailure).waitForDisplayed();
  await session.close();
});
