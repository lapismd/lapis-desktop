import { test } from "node:test";
import assert from "node:assert/strict";
import { TerminalError } from "@lapismd/terminal";
import { TerminalSessions } from "../../src/lib/terminal/terminal-sessions.ts";

function fixture() {
  const events = [],
    retained = new Map();
  let opening;
  const backend = {
    activate: async () => events.push("admit"),
    release: async (mode) => events.push(`release:${mode}`),
    client: {
      targets: async () => [{ id: "vault-shell", label: "Vault shell" }],
      list: async () => [...retained.values()].map((s) => ({ id: s.id })),
      session: (info) => retained.get(info.id),
      open: async ({ requestId }) => {
        events.push("open");
        await opening;
        const session = {
          id: requestId,
          detach: async () => events.push(`detach:${requestId}`),
          close: async () => {
            events.push(`close:${requestId}`);
            retained.delete(requestId);
          },
        };
        retained.set(requestId, session);
        return session;
      },
    },
  };
  return { backend, events, retained, delay: (value) => (opening = value) };
}

test("restoration never launches shells; live reload reuses the retained session", async () => {
  const { backend, events } = fixture();
  const first = new TerminalSessions(backend);
  assert.equal(await first.restore("old-process"), undefined);
  assert.deepEqual(events, ["admit"]);
  const active = await first.start("one");
  await first.dispose("reload");
  assert.ok(events.includes("detach:one"));
  assert.ok(!events.includes("close:one"));
  const next = new TerminalSessions(backend);
  assert.equal(await next.restore("one"), active);
  await next.dispose("close");
  assert.ok(events.includes("close:one"));
});

test("opening is idempotent, explicit close stops only its owned shell", async () => {
  const { backend, events } = fixture();
  const sessions = new TerminalSessions(backend);
  const [one, same] = await Promise.all([
    sessions.start("one"),
    sessions.start("one"),
  ]);
  assert.equal(one, same);
  await sessions.start("two");
  await sessions.close("one");
  assert.ok(events.includes("close:one"));
  assert.ok(!events.includes("close:two"));
  assert.equal(events.filter((v) => v === "open").length, 2);
  await sessions.dispose("close");
  assert.ok(events.includes("close:two"));
});

test("confirmed disposal waits for pending opens and prevents later launches", async () => {
  const state = fixture();
  let resolve;
  state.delay(new Promise((done) => (resolve = done)));
  const sessions = new TerminalSessions(state.backend);
  const pending = sessions.start("slow");
  const disposed = sessions.dispose("close");
  resolve();
  await pending;
  await disposed;
  assert.ok(state.events.includes("close:slow"));
  await assert.rejects(sessions.start("late"), /disabled/);
});

test("admission errors retry and failed cleanup stays visible", async () => {
  const state = fixture();
  state.backend.activate = async () => {
    throw new Error("unavailable");
  };
  const sessions = new TerminalSessions(state.backend);
  await assert.rejects(sessions.start("retry"), /unavailable/);
  state.backend.activate = async () => {};
  const active = await sessions.start("retry");
  active.close = async () => {
    throw new Error("close failed");
  };
  await assert.rejects(sessions.dispose("close"), /close failed/);
});

test("existing installed disabling remains the bundled default without rewriting unrelated data", async () => {
  const { terminalEnabledByDefault } = await import(
    "../../src/lib/terminal/terminal-preferences.ts"
  );
  const data = new Map();
  const app = {
    vault: {
      adapter: {
        exists: async (path) => data.has(path),
        read: async (path) => data.get(path),
      },
    },
  };
  assert.equal(await terminalEnabledByDefault(app), true);
  data.set(
    ".lapis/installed-plugins.json",
    JSON.stringify({
      plugins: { terminal: { enabled: false }, other: { enabled: true } },
    }),
  );
  const original = [...data];
  assert.equal(await terminalEnabledByDefault(app), false);
  assert.deepEqual([...data], original);
  data.clear();
  data.set(".lapis/app-shell-plugins.json", '{"terminal":false,"other":true}');
  assert.equal(await terminalEnabledByDefault(app), false);
  data.set(".lapis/app-shell-plugins.json", "not-json");
  await assert.rejects(terminalEnabledByDefault(app));
});

test("an uncertain open retries its exact identity and closing still releases the native request", async () => {
  const { TerminalTab } = await import(
    "../../src/lib/terminal/terminal-tab.ts"
  );
  const state = fixture();
  const create = state.backend.client.open;
  let ambiguous = true;
  const requests = [];
  state.backend.client.open = async (options) => {
    requests.push(options.requestId);
    const session =
      state.retained.get(options.requestId) ?? (await create(options));
    if (ambiguous) {
      ambiguous = false;
      throw new Error("response lost");
    }
    return session;
  };
  state.backend.client.transport = {
    close: async (id) => {
      state.events.push(`close:${id}`);
      state.retained.delete(id);
    },
  };
  const sessions = new TerminalSessions(state.backend);
  const tab = new TerminalTab(
    sessions,
    undefined,
    () => {},
    () => {},
  );
  await tab.start();
  assert.match(tab.state.error, /response lost/);
  await tab.start();
  assert.equal(requests[0], requests[1]);
  assert.equal(state.retained.size, 1);
  await tab.close();
  assert.equal(state.retained.size, 0);

  ambiguous = true;
  const uncertain = new TerminalTab(
    sessions,
    undefined,
    () => {},
    () => {},
  );
  await uncertain.start();
  await uncertain.close();
  assert.equal(state.retained.size, 0);
  await sessions.dispose("close");
});

test("failed native release can be retried without admitting new terminal work", async () => {
  const state = fixture();
  let attempts = 0;
  state.backend.release = async () => {
    if (++attempts === 1) throw new Error("release interrupted");
  };
  const sessions = new TerminalSessions(state.backend);
  await sessions.start("one");
  await assert.rejects(sessions.dispose("close"), /release interrupted/);
  await assert.rejects(sessions.start("late"), /disabled/);
  await sessions.dispose("close");
  assert.equal(attempts, 2);
});

test("successful scoped host release resolves denied closes of revoked terminal handles", async () => {
  const state = fixture();
  const sessions = new TerminalSessions(state.backend);
  const active = await sessions.start("revoked");
  active.close = async () => {
    throw new TerminalError("denied", "Terminal admission was revoked");
  };
  state.backend.release = async (mode) => {
    assert.equal(mode, "close");
    state.events.push("confirmed-scoped-release");
    state.retained.clear();
  };
  await sessions.dispose("close");
  assert.equal(state.retained.size, 0);
  assert.ok(state.events.includes("confirmed-scoped-release"));
  await assert.rejects(sessions.start("late"), /disabled/);
});

test("denied cleanup stays blocking until scoped host release succeeds", async () => {
  const state = fixture();
  const sessions = new TerminalSessions(state.backend);
  const active = await sessions.start("revoked");
  const denied = new TerminalError("denied", "Terminal admission was revoked");
  active.close = async () => {
    throw denied;
  };
  let releases = 0;
  state.backend.release = async () => {
    if (++releases === 1) throw new Error("scoped release failed");
    state.retained.clear();
  };
  await assert.rejects(sessions.dispose("close"), (error) => {
    assert.ok(error instanceof AggregateError);
    assert.ok(error.errors.includes(denied));
    assert.match(error.message, /scoped release failed/);
    return true;
  });
  assert.equal(state.retained.size, 1);
  await assert.rejects(sessions.start("late"), /disabled/);
  await sessions.dispose("close");
  assert.equal(releases, 2);
  assert.equal(state.retained.size, 0);
});

test("reload keeps denied detach failures blocking and never closes retained shells", async () => {
  const state = fixture();
  const sessions = new TerminalSessions(state.backend);
  const active = await sessions.start("retained");
  const denied = new TerminalError("denied", "Terminal admission was revoked");
  active.detach = async () => {
    throw denied;
  };
  await assert.rejects(sessions.dispose("reload"), (error) => {
    assert.ok(error instanceof AggregateError);
    assert.ok(error.errors.includes(denied));
    return true;
  });
  assert.ok(state.events.includes("release:reload"));
  assert.equal(state.retained.size, 1);
  assert.ok(!state.events.includes("close:retained"));
  await assert.rejects(sessions.start("late"), /disabled/);
});

test("scoped release does not suppress untyped denied-shaped cleanup errors", async () => {
  const state = fixture();
  const sessions = new TerminalSessions(state.backend);
  const active = await sessions.start("broken");
  const malformed = Object.assign(new Error("unexpected cleanup error"), {
    code: "denied",
  });
  active.close = async () => {
    throw malformed;
  };
  await assert.rejects(sessions.dispose("close"), (error) => {
    assert.ok(error instanceof AggregateError);
    assert.ok(error.errors.includes(malformed));
    return true;
  });
});
