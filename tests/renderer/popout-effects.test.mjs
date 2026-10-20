import { test } from "node:test";
import assert from "node:assert/strict";
import { installPopupEffects } from "../../src/lib/desktop/popup-effects.ts";

function fixture(t) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "location");
  Object.defineProperty(globalThis, "location", {
    configurable: true,
    value: { origin: "tauri://localhost" },
  });
  t.after(() =>
    previous
      ? Object.defineProperty(globalThis, "location", previous)
      : Reflect.deleteProperty(globalThis, "location"),
  );
  const owner = new EventTarget(),
    calls = [],
    errors = [];
  const clipboard = { read: () => "original" },
    open = () => null;
  Object.assign(owner, { navigator: { clipboard }, open });
  let reloads = 0;
  const stop = installPopupEffects(
    owner,
    "workspace-popup-owned",
    async (frame) => {
      calls.push(frame);
    },
    {
      readText: async () => "shared",
      writeText: async () => {},
      openExternal: async () => {},
      openAppUrl: async () => {},
    },
    async () => {
      reloads++;
    },
    (error) => errors.push(error),
  );
  t.after(stop);
  return {
    owner,
    calls,
    errors,
    stop,
    clipboard,
    open,
    reloads: () => reloads,
  };
}
function mouse(
  owner,
  { button = 0, detail = 1, interactive = false, disabled = false } = {},
) {
  const event = new Event("mousedown", { cancelable: true });
  Object.assign(event, { button, detail });
  Object.defineProperty(event, "target", {
    value: {
      closest: (selector) =>
        selector === "[data-desktop-drag-region]"
          ? { getAttribute: () => (disabled ? "false" : "deep") }
          : interactive
            ? {}
            : null,
    },
  });
  owner.dispatchEvent(event);
  return event;
}

test("popup drag and double-click zoom name their own native window and exclude controls", (t) => {
  const f = fixture(t);
  assert.equal(mouse(f.owner, { interactive: true }).defaultPrevented, false);
  assert.equal(mouse(f.owner, { disabled: true }).defaultPrevented, false);
  assert.equal(mouse(f.owner, { button: 1 }).defaultPrevented, false);
  assert.equal(mouse(f.owner).defaultPrevented, true);
  assert.equal(mouse(f.owner, { detail: 2 }).defaultPrevented, true);
  assert.deepEqual(f.calls, [
    { action: "drag", label: "workspace-popup-owned" },
    { action: "zoom", label: "workspace-popup-owned" },
  ]);
});

test("popup reload enters the main leave guard once and cleanup releases its own effects", async (t) => {
  const f = fixture(t);
  const key = (repeat = false) => {
    const event = new Event("keydown", { cancelable: true });
    Object.assign(event, { metaKey: true, key: "r", repeat });
    f.owner.dispatchEvent(event);
    return event;
  };
  assert.equal(key().defaultPrevented, true);
  assert.equal(key(true).defaultPrevented, true);
  assert.equal(f.reloads(), 1);
  assert.equal(await f.owner.navigator.clipboard.readText(), "shared");
  f.stop();
  assert.equal(f.owner.open, f.open);
  assert.equal(f.owner.navigator.clipboard, f.clipboard);
  assert.equal(key().defaultPrevented, false);
  mouse(f.owner);
  assert.deepEqual(f.calls, []);
  assert.deepEqual(f.errors, []);
});
