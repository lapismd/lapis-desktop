import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { nativeSession } from "./native-session.mjs";

test("native text clipboard ports round trip Unicode and reject oversized writes", async (context) => {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, "integration-ports-"),
  );
  const session = await nativeSession("integration-ports", root);
  context.after(session.cleanup);
  const result = await session.browser.execute(async () => {
    const invoke = globalThis.__TAURI__.core.invoke;
    let previous;
    try {
      previous = await invoke("desktop_clipboard_read");
    } catch {}
    try {
      await invoke("desktop_clipboard_write", {
        text: "Lapis café 🪨\nclipboard",
      });
      const text = await invoke("desktop_clipboard_read");
      await navigator.clipboard.writeText("Shared clipboard control");
      const shared = await navigator.clipboard.readText();
      let bounded = false;
      try {
        await invoke("desktop_clipboard_write", {
          text: "x".repeat(4 * 1024 * 1024 + 1),
        });
      } catch {
        bounded = true;
      }
      return { text, shared, bounded };
    } finally {
      if (previous !== undefined)
        await invoke("desktop_clipboard_write", { text: previous });
    }
  });
  assert.deepEqual(result, {
    text: "Lapis café 🪨\nclipboard",
    shared: "Shared clipboard control",
    bounded: true,
  });
  await session.close();
});

test("the installed native menu retains platform roles and guarded host actions", async (context) => {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, "integration-menus-"),
  );
  const session = await nativeSession("integration-menus", root);
  context.after(session.cleanup);
  const info = await session.browser.execute(() =>
    globalThis.__TAURI__.core.invoke("shell_info"),
  );
  const menus = info.nativeMenus.Ok;
  assert.deepEqual(
    menus.map((entry) => entry.text),
    ["Lapis Notes", "File", "Edit", "View", "Window", "Help"],
  );
  assert.equal(
    menus[0].children.find((entry) => entry.text === "About Lapis Notes")
      .native,
    true,
  );
  assert.equal(
    menus[1].children.find((entry) => entry.id === "open-vault").enabled,
    true,
  );
  for (const name of ["Cut", "Copy", "Paste", "Select All"])
    assert.equal(
      menus[2].children.find((entry) => entry.text === name).native,
      true,
    );
  for (const id of ["undo", "redo"]) {
    assert.equal(
      menus[2].children.find((entry) => entry.id === id).native,
      false,
    );
    assert.equal(
      menus[2].children.find((entry) => entry.id === id).enabled,
      true,
    );
  }
  assert.equal(
    menus[3].children.find((entry) => entry.id === "reload").enabled,
    true,
  );
  assert.equal(
    menus[3].children.find((entry) => entry.text === "Force Reload").enabled,
    false,
  );
  await session.close();
});

test("native external opening rejects unsafe authority and keeps the WebView at its admitted origin", async (context) => {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, "integration-external-"),
  );
  const session = await nativeSession("integration-external", root);
  context.after(session.cleanup);
  const before = await session.browser.getUrl();
  const rejected = await session.browser.execute(async () => {
    const rejected = [];
    for (const url of [
      "file:///etc/passwd",
      "javascript:alert(1)",
      "https://user:secret@example.com",
      "invalid",
    ]) {
      try {
        await globalThis.__TAURI__.core.invoke("desktop_external_open", {
          url,
        });
        rejected.push(false);
      } catch {
        rejected.push(true);
      }
    }
    window.open("https://example.com/#lapis-desktop-integration", "_blank");
    return rejected;
  });
  assert.deepEqual(rejected, [true, true, true, true]);
  await session.browser.waitUntil(() => {
    try {
      return readFileSync(
        join(root, "integration-actions.jsonl"),
        "utf8",
      ).includes('"kind":"external"');
    } catch {
      return false;
    }
  });
  assert.equal(await session.browser.getUrl(), before);
  const records = readFileSync(join(root, "integration-actions.jsonl"), "utf8")
    .trim()
    .split("\n")
    .map(JSON.parse);
  assert.deepEqual(
    records
      .filter((entry) => entry.kind === "external")
      .map((entry) => entry.value),
    ["https://example.com/#lapis-desktop-integration"],
  );
  await session.close();
});

test("component-owned external links open once through their existing action", async (context) => {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, "integration-owned-link-"),
  );
  const session = await nativeSession("integration-owned-link", root);
  context.after(session.cleanup);
  await session.browser.execute(() => {
    const link = document.createElement("a");
    link.id = "component-owned-link";
    link.href = "https://example.com/#lapis-owned-link";
    link.textContent = "Component-owned external link";
    document.addEventListener("click", async (event) => {
      if (event.target !== link) return;
      event.preventDefault();
      await globalThis.__TAURI__.core.invoke("desktop_external_open", {
        url: link.href,
      });
      link.dataset.opened = "true";
    });
    document.body.append(link);
  });
  await session.browser.$("#component-owned-link").click();
  await session.browser.waitUntil(() =>
    session.browser.execute(
      () =>
        document.querySelector("#component-owned-link").dataset.opened ===
        "true",
    ),
  );
  const records = readFileSync(join(root, "integration-actions.jsonl"), "utf8")
    .trim()
    .split("\n")
    .map(JSON.parse);
  assert.deepEqual(
    records
      .filter((entry) => entry.kind === "external")
      .map((entry) => entry.value),
    ["https://example.com/#lapis-owned-link"],
  );
  await session.close();
});

test("component-owned application links enqueue once after delegated handling", async (context) => {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, "integration-owned-url-"),
  );
  const session = await nativeSession("integration-owned-url", root);
  context.after(session.cleanup);
  await session.browser.execute(() => {
    const link = document.createElement("a");
    link.id = "component-owned-url";
    link.href = "lapis://open?file=Owned";
    link.textContent = "Component-owned application link";
    document.addEventListener("click", async (event) => {
      if (event.target !== link) return;
      event.preventDefault();
      await globalThis.__TAURI__.core.invoke("desktop_url_enqueue", {
        url: link.href,
      });
      link.dataset.queued = "true";
    });
    document.body.append(link);
  });
  await session.browser.$("#component-owned-url").click();
  await session.browser.waitUntil(() =>
    session.browser.execute(
      () =>
        document.querySelector("#component-owned-url").dataset.queued ===
        "true",
    ),
  );
  const queued = await session.browser.execute(async () => {
    const invoke = globalThis.__TAURI__.core.invoke;
    const first = await invoke("desktop_url_next");
    await invoke("desktop_url_ack", { id: first.id });
    return { first: first.url, next: await invoke("desktop_url_next") };
  });
  assert.deepEqual(queued, { first: "lapis://open?file=Owned", next: null });
  await session.close();
});

test("native notifications validate payloads before requesting operating-system permission", async (context) => {
  const root = mkdtempSync(
    join(
      process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT,
      "integration-notification-bounds-",
    ),
  );
  const session = await nativeSession("integration-notification-bounds", root);
  context.after(session.cleanup);
  const rejected = await session.browser.execute(async () => {
    const rejected = [];
    for (const notification of [
      { id: "test", message: "x".repeat(4097), severity: "info" },
      { id: "test", message: "Saved", severity: "execute" },
    ]) {
      try {
        await globalThis.__TAURI__.core.invoke("desktop_notify", {
          notification,
        });
        rejected.push(false);
      } catch {
        rejected.push(true);
      }
    }
    return rejected;
  });
  assert.deepEqual(rejected, [true, true]);
  await session.close();
});
