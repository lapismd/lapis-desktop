import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DesktopIntegrationPorts,
  externalLink,
  installDesktopClipboard,
} from "../../src/lib/native/desktop-integration.ts";

test("shared clipboard calls enter native text ports while other clipboard methods retain their receiver", async () => {
  const calls = [];
  const ports = new DesktopIntegrationPorts(async (command, payload) => {
    calls.push({ command, payload });
    return command.endsWith("read") ? "café" : undefined;
  });
  const original = {
    read() {
      assert.equal(this, original);
      return "binary";
    },
  };
  const navigator = { clipboard: original };
  const stop = installDesktopClipboard(ports, navigator);
  assert.equal(await navigator.clipboard.readText(), "café");
  await navigator.clipboard.writeText("🪨");
  assert.equal(navigator.clipboard.read(), "binary");
  stop();
  assert.equal(navigator.clipboard, original);
  assert.deepEqual(calls, [
    { command: "desktop_clipboard_read", payload: undefined },
    { command: "desktop_clipboard_write", payload: { text: "🪨" } },
  ]);
});

test("clipboard teardown removes a host property when the browser only had an inherited port", () => {
  const inherited = {};
  const navigator = Object.create({ clipboard: inherited });
  const ports = new DesktopIntegrationPorts(async () => undefined);
  const stop = installDesktopClipboard(ports, navigator);
  assert.ok(Object.hasOwn(navigator, "clipboard"));
  stop();
  assert.equal(Object.hasOwn(navigator, "clipboard"), false);
  assert.equal(navigator.clipboard, inherited);
});

test("external links preserve admitted origins and reject executable, credential and file URLs", () => {
  const origin = "http://tauri.localhost";
  for (const value of [
    "/index.html",
    "http://tauri.localhost/note",
    "javascript:alert(1)",
    "file:///etc/passwd",
    "https://user:password@example.com",
    "lapis://open?file=Note",
  ])
    assert.equal(externalLink(value, origin), null);
  assert.equal(
    externalLink("https://lapismd.com/notes", origin),
    "https://lapismd.com/notes",
  );
});

test("native notification errors stay observable to their owning caller", async () => {
  const ports = new DesktopIntegrationPorts(async () => {
    throw new Error("Notifications disabled");
  });
  await assert.rejects(
    ports.notify({ id: "test", message: "Saved", severity: "info" }),
    /Notifications disabled/,
  );
});
