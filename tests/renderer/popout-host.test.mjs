import { test } from "node:test";
import assert from "node:assert/strict";
import { createDesktopPopouts } from "../../src/lib/desktop/workspace-popouts.ts";

function fixture() {
  const calls = [],
    errors = [],
    effects = [],
    events = {};
  let serial = 0;
  const ticket = () => {
    const label = `workspace-popup-${++serial}`;
    return { label, url: "about:blank" };
  };
  const options = {
    sessionId: "vault-a",
    call: async (frame) => {
      calls.push(frame);
      if (frame.action === "begin")
        return [ticket(), ticket(), ticket(), ticket()];
      if (frame.action === "issue") return ticket();
      if (frame.action === "requestClose")
        return { label: frame.label, requestId: `close-${serial++}` };
      if (frame.action === "finishClose" && frame.saved)
        events.retired(frame.label);
    },
    onClose: async (listener) => {
      events.close = listener;
      return () => {
        delete events.close;
      };
    },
    onRetire: async (listener) => {
      events.retired = listener;
      return () => {
        delete events.retired;
      };
    },
    open: () => ({
      document: { title: "", hasFocus: () => false, activeElement: null },
    }),
    setup: (_, label) => {
      effects.push(label);
      return () => {
        effects.splice(effects.indexOf(label), 1);
      };
    },
    report: (error) => errors.push(error),
  };
  const input = {
    id: "note",
    title: "Note",
    bounds: { x: 20, y: 30, width: 800, height: 600 },
  };
  return { options, calls, errors, effects, events, input };
}

test("a blocked native open retains the source and retires only its unused ticket", async () => {
  const f = fixture();
  f.options.open = () => null;
  const host = await createDesktopPopouts(f.options);
  assert.equal(host.host.open(f.input), null);
  await host.fence();
  assert.ok(f.calls.some((call) => call.action === "cancelTicket"));
  assert.deepEqual(f.effects, []);
  assert.deepEqual(f.errors, []);
  await host.dispose();
});

test("the shared host uses the exact native ticket and independent document ownership", async () => {
  const f = fixture(),
    opened = [];
  f.options.open = (...args) => {
    opened.push(args);
    return {
      document: {
        title: "",
        hasFocus: () => opened.length === 2,
        activeElement: null,
      },
    };
  };
  const host = await createDesktopPopouts(f.options);
  const first = host.host.open(f.input);
  const second = host.host.open({ ...f.input, id: "other", title: "Other" });
  assert.equal(opened[0][0], "about:blank");
  assert.match(opened[0][2], /width=800,height=600/);
  assert.equal(first.document.title, "Note");
  assert.equal(second.document.title, "Other");
  assert.notEqual(first.window, second.window);
  let closed = 0;
  first.onClose(() => closed++);
  first.close();
  await first.drained();
  assert.equal(closed, 1);
  assert.equal(f.effects.length, 1);
  second.close();
  await host.dispose();
  assert.deepEqual(f.effects, []);
  assert.deepEqual(f.errors, []);
});

test("a refused save acknowledges the exact native receipt and keeps the window usable", async () => {
  const f = fixture();
  const host = await createDesktopPopouts(f.options);
  const handle = host.host.open(f.input);
  const label = f.effects[0];
  handle.onCloseRequest(async () => false);
  await f.events.close({ label, requestId: "original-close" });
  assert.deepEqual(
    f.calls.find((call) => call.action === "finishClose"),
    { action: "finishClose", label, requestId: "original-close", saved: false },
  );
  assert.equal(f.effects.length, 1);
  handle.onCloseRequest(async () => {
    handle.close();
    return true;
  });
  await f.events.close({ label, requestId: "retry-close" });
  await handle.drained();
  assert.equal(f.effects.length, 0);
  assert.deepEqual(f.errors, []);
  await host.dispose();
});

test("a failed save reports once and repeated native close delivery shares its guard", async () => {
  const f = fixture();
  const host = await createDesktopPopouts(f.options);
  const handle = host.host.open(f.input),
    label = f.effects[0];
  const gate = Promise.withResolvers();
  let attempts = 0;
  handle.onCloseRequest(async () => {
    attempts++;
    await gate.promise;
    throw new Error("Save refused");
  });
  const first = f.events.close({ label, requestId: "same" });
  const second = f.events.close({ label, requestId: "same" });
  gate.resolve();
  await Promise.all([first, second]);
  assert.equal(attempts, 1);
  assert.equal(f.errors.length, 1);
  assert.match(f.errors[0].message, /Save refused/);
  assert.equal(f.effects.length, 1);
  handle.close();
  await host.dispose();
});

test("leave fencing prevents new windows and resumes the same owner after a failed leave", async () => {
  const f = fixture();
  const host = await createDesktopPopouts(f.options);
  await host.fence();
  assert.equal(host.host.open(f.input), null);
  await host.resume();
  const handle = host.host.open(f.input);
  assert.ok(handle);
  handle.close();
  await host.dispose();
  assert.equal(host.host.open(f.input), null);
  assert.equal(f.events.close, undefined);
  assert.equal(f.events.retired, undefined);
});

test("failed startup releases listeners and never exposes a half-admitted opener", async () => {
  const f = fixture();
  f.options.call = async () => {
    throw new Error("Admission failed");
  };
  await assert.rejects(createDesktopPopouts(f.options), /Admission failed/);
  assert.equal(f.events.close, undefined);
  assert.equal(f.events.retired, undefined);
});

test("setup failure closes the empty native window while keeping the source tab reachable", async () => {
  const f = fixture();
  f.options.setup = () => {
    throw new Error("Document setup failed");
  };
  const host = await createDesktopPopouts(f.options);
  assert.equal(host.host.open(f.input), null);
  await host.dispose();
  assert.equal(f.errors.length, 1);
  assert.match(f.errors[0].message, /Document setup failed/);
  assert.ok(
    f.calls.some((frame) => frame.action === "finishClose" && frame.saved),
  );
});

for (const cancelled of [true, false]) {
  test(`failed opening waits for ${cancelled ? "acknowledged" : "uncertain"} ticket cancellation before another native open`, async () => {
    const f = fixture(),
      gate = Promise.withResolvers();
    const call = f.options.call,
      open = f.options.open;
    let attempts = 0;
    f.options.open = () => (++attempts === 1 ? null : open());
    f.options.call = (frame) =>
      frame.action === "cancelTicket" ? gate.promise : call(frame);
    const host = await createDesktopPopouts(f.options);
    assert.equal(host.host.open(f.input), null);
    assert.equal(host.host.open(f.input), null);
    assert.equal(attempts, 1);
    if (cancelled) gate.resolve();
    else gate.reject(new Error("Cancellation outcome unknown"));
    await new Promise(setImmediate);
    if (!cancelled) {
      assert.equal(host.host.open(f.input), null);
      assert.equal(attempts, 1);
      assert.match(f.errors[0].message, /Cancellation outcome unknown/);
      await host.fence();
      await host.resume();
    }
    const handle = host.host.open(f.input);
    assert.ok(handle);
    assert.equal(
      handle.label,
      cancelled ? "workspace-popup-2" : "workspace-popup-5",
    );
    handle.close();
    await host.dispose();
  });
}
