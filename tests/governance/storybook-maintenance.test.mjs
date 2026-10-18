import test from "node:test";
import assert from "node:assert/strict";
import {
  readFile,
  mkdtemp,
  mkdir,
  writeFile,
  rm,
  stat,
  symlink,
  realpath,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  parseOptions,
  runStorybook,
} from "../../scripts/storybook-runtime.mjs";
import { previewArgs } from "../../scripts/storybook-owner.mjs";
import { safePath } from "../../scripts/storybook-files.mjs";
import { usesCatalogCache } from "../../scripts/storybook-process.mjs";
import { spawnSync } from "node:child_process";

async function fixture(t) {
  const root = await realpath(await mkdtemp(join(tmpdir(), "lapis preview-")));
  t.after(() => rm(root, { recursive: true, force: true }));
  const calls = [],
    processes = new Map();
  let bound = [],
    sequence = 800000,
    hold = false;
  const ports = {
    async preflight() {
      calls.push("preflight");
      return join(root, "node_modules/storybook/dist/bin/dispatcher.js");
    },
    async launch(cwd, port, log, entry) {
      const pid = ++sequence;
      processes.set(pid, {
        pid,
        uid: process.getuid(),
        started: `birth-${pid}`,
        command: [process.execPath, entry, ...previewArgs(port)].join(" "),
        cwd,
      });
      bound = [pid];
      calls.push(["launch", pid]);
      return {
        pid,
        exitCode: null,
        kill() {
          processes.delete(pid);
          bound = [];
        },
      };
    },
    async inspect(pid) {
      return processes.get(pid);
    },
    async listeners() {
      return bound;
    },
    signal(pid) {
      calls.push(["signal", pid]);
      if (!hold) {
        processes.delete(pid);
        bound = bound.filter((id) => id !== pid);
      }
    },
    async pause() {},
    async ready() {
      return true;
    },
    async consumers() {
      return [...processes.values()];
    },
  };
  return {
    root,
    ports,
    calls,
    processes,
    file: join(root, ".local/storybook/7490.json"),
    run: (action, apply = false) =>
      runStorybook(root, { action, port: 7490, apply }, ports),
    bind(pids) {
      bound = pids;
    },
    hold() {
      hold = true;
    },
  };
}

test("catalog exposes scoped lifecycle and dry-run cache commands without changing foreground launch", async () => {
  const { scripts } = JSON.parse(await readFile("package.json", "utf8"));
  assert.match(scripts.storybook, /^storybook dev --host 127\.0\.0\.1/);
  for (const action of ["start", "status", "stop", "restart", "clean"])
    assert.equal(
      scripts[`storybook:${action}`],
      `node scripts/storybook.mjs ${action}`,
    );
});

test("options retain loopback port defaults and reject ambiguous mutations before work", () => {
  assert.deepEqual(parseOptions(["start"], {}), {
    action: "start",
    port: 7480,
    apply: false,
  });
  assert.equal(
    parseOptions(["status"], { LAPIS_STORYBOOK_PORT: "7490" }).port,
    7490,
  );
  assert.equal(
    parseOptions(["clean", "--", "--port", "7491", "--apply"], {}).port,
    7491,
  );
  for (const args of [
    ["stop", "--apply"],
    ["start", "--host", "0.0.0.0"],
    ["start", "--port", "80"],
    ["start", "--port", "70000"],
    ["start", "--port", "../../x"],
    ["start", "--port", "7490", "--port", "7491"],
    ["clean", "--apply", "--apply"],
  ])
    assert.throws(() => parseOptions(args, {}));
});

test("managed start is idempotent, status is live and restart changes only its owned PID", async (t) => {
  const f = await fixture(t);
  assert.equal((await f.run("status")).state, "stopped");
  await assert.rejects(stat(join(f.root, ".local")), { code: "ENOENT" });
  const first = await f.run("start");
  assert.equal(first.state, "running");
  assert.equal((await f.run("start")).pid, first.pid);
  assert.equal(f.calls.filter((c) => c[0] === "launch").length, 1);
  const record = JSON.parse(await readFile(f.file, "utf8"));
  assert.equal(record.cwd, f.root);
  assert.match(
    record.command,
    /--host 127\.0\.0\.1 --port 7490 .*--exact-port$/,
  );
  assert.equal((await stat(f.file)).mode & 0o777, 0o600);
  const second = await f.run("restart");
  assert.notEqual(second.pid, first.pid);
  assert.deepEqual(
    f.calls.filter((c) => c[0] === "signal"),
    [["signal", first.pid]],
  );
  assert.equal((await f.run("stop")).state, "stopped");
  await assert.rejects(readFile(f.file), { code: "ENOENT" });
});

test("an unowned listener is preserved by start, stop and restart", async (t) => {
  const f = await fixture(t);
  f.bind([12345]);
  assert.equal((await f.run("status")).state, "foreign");
  for (const action of ["start", "stop", "restart"])
    await assert.rejects(f.run(action), /foreign|unowned/);
  assert.equal(f.calls.filter((c) => Array.isArray(c)).length, 0);
});

test("PID reuse, changed owner/directory/command and identity changes before signal reject authority", async (t) => {
  for (const key of ["started", "uid", "cwd", "command"]) {
    const f = await fixture(t),
      started = await f.run("start"),
      original = f.processes.get(started.pid);
    let probes = 0;
    f.ports.inspect = async () =>
      ++probes === 1
        ? original
        : {
            ...original,
            [key]: key === "uid" ? original.uid + 1 : "replacement",
          };
    await assert.rejects(f.run("stop"), /identity changed/);
    assert.equal(f.calls.filter((c) => c[0] === "signal").length, 0);
    assert.equal(JSON.parse(await readFile(f.file, "utf8")).pid, started.pid);
  }
});

test("restart preflight failure preserves the running process and its ownership", async (t) => {
  const f = await fixture(t),
    started = await f.run("start");
  f.ports.preflight = async () => {
    throw new Error("Missing installed CLI");
  };
  await assert.rejects(f.run("restart"), /Missing installed CLI/);
  assert.equal((await f.run("status")).pid, started.pid);
  assert.equal(f.calls.filter((c) => c[0] === "signal").length, 0);
});

test("an owned but unresponsive story index is unready and cannot authorize another start", async (t) => {
  const f = await fixture(t),
    started = await f.run("start");
  f.ports.ready = async () => false;
  const current = await f.run("status");
  assert.equal(current.state, "unready");
  assert.equal(current.pid, started.pid);
  await assert.rejects(f.run("start"), /unready/);
  assert.equal(f.calls.filter((c) => c[0] === "launch").length, 1);
  assert.equal((await f.run("stop")).state, "stopped");
});

test("unknown stop retains ownership and never escalates to another signal", async (t) => {
  const f = await fixture(t),
    started = await f.run("start");
  f.hold();
  await assert.rejects(f.run("stop"), /ownership record is retained/);
  assert.equal((await f.run("status")).pid, started.pid);
  assert.deepEqual(
    f.calls.filter((c) => c[0] === "signal"),
    [["signal", started.pid]],
  );
});

test("a transient exit observation waits for confirmed termination without another signal", async (t) => {
  const f = await fixture(t);
  await f.run("start");
  let unavailable = true;
  f.ports.inspect = async (pid) => {
    if (unavailable && f.calls.some((c) => c[0] === "signal")) {
      unavailable = false;
      throw Object.assign(
        new Error("Process directory is temporarily unavailable"),
        { code: "PREVIEW_IDENTITY_UNAVAILABLE" },
      );
    }
    return f.processes.get(pid);
  };
  assert.equal((await f.run("stop")).state, "stopped");
  assert.equal(f.calls.filter((c) => c[0] === "signal").length, 1);
  await assert.rejects(readFile(f.file), { code: "ENOENT" });
});

test("a stale PID record never authorizes stopping the replacement process", async (t) => {
  const f = await fixture(t),
    started = await f.run("start");
  const previous = f.processes.get(started.pid);
  f.processes.set(started.pid, { ...previous, started: "replacement birth" });
  f.bind([]);
  const replacement = await f.run("start");
  assert.notEqual(replacement.pid, started.pid);
  assert.equal(f.processes.get(started.pid).started, "replacement birth");
  assert.equal(f.calls.filter((c) => c[0] === "signal").length, 0);
  await f.run("stop");
});

test("a port takeover during startup stops only the newly spawned preview", async (t) => {
  const f = await fixture(t),
    launch = f.ports.launch;
  f.ports.launch = async (...args) => {
    const child = await launch(...args);
    f.bind([child.pid, 12345]);
    return child;
  };
  await assert.rejects(f.run("start"), /lost its process or port/);
  assert.equal((await f.run("status")).state, "foreign");
  assert.deepEqual(
    f.calls.filter((c) => c[0] === "signal"),
    [["signal", 800001]],
  );
});

test("unsafe log preflight cannot stop a healthy managed preview", async (t) => {
  const f = await fixture(t),
    outside = await fixture(t),
    started = await f.run("start");
  await writeFile(join(outside.root, "sentinel"), "preserve");
  await symlink(
    join(outside.root, "sentinel"),
    join(f.root, ".local/storybook/7490.log"),
  );
  await assert.rejects(f.run("restart"), /Refusing symlink/);
  assert.equal((await f.run("status")).pid, started.pid);
  assert.equal(f.calls.filter((c) => c[0] === "signal").length, 0);
  assert.equal(
    await readFile(join(outside.root, "sentinel"), "utf8"),
    "preserve",
  );
  await f.run("stop");
});

test("startup readiness failure cleans only its original owned process", async (t) => {
  const f = await fixture(t);
  f.ports.ready = async () => false;
  await assert.rejects(f.run("start"), /startup did not finish/);
  assert.equal((await f.run("status")).state, "stopped");
  assert.equal(f.calls.filter((c) => c[0] === "signal").length, 1);
});

test("cache cleaning previews by default and cannot touch live consumers or application data", async (t) => {
  const f = await fixture(t);
  for (const relative of [
    "node_modules/.cache/storybook",
    "node_modules/.vite",
    ".local/dev-demo",
    "storybook-static",
  ]) {
    await mkdir(join(f.root, relative), { recursive: true });
    await writeFile(join(f.root, relative, "sentinel"), relative);
  }
  const preview = await f.run("clean");
  assert.equal(preview.apply, false);
  assert.equal(preview.targets.length, 2);
  await f.run("start");
  await assert.rejects(f.run("clean", true), /Stop checkout cache consumers/);
  await stat(join(f.root, "node_modules/.cache/storybook/sentinel"));
  await f.run("stop");
  await f.run("clean", true);
  await assert.rejects(stat(join(f.root, "node_modules/.cache/storybook")), {
    code: "ENOENT",
  });
  await assert.rejects(stat(join(f.root, "node_modules/.vite")), {
    code: "ENOENT",
  });
  for (const relative of [".local/dev-demo", "storybook-static"])
    assert.equal(
      await readFile(join(f.root, relative, "sentinel"), "utf8"),
      relative,
    );
});

test("cache and metadata symlinks and path traversal cannot escape the checkout", async (t) => {
  const f = await fixture(t),
    outside = await fixture(t);
  await mkdir(join(f.root, "node_modules/.cache"), { recursive: true });
  await writeFile(join(outside.root, "sentinel"), "preserve");
  await symlink(outside.root, join(f.root, "node_modules/.cache/storybook"));
  await assert.rejects(f.run("clean", true), /Refusing symlink/);
  assert.equal(
    await readFile(join(outside.root, "sentinel"), "utf8"),
    "preserve",
  );
  await assert.rejects(safePath(f.root, "../outside"), /Invalid preview path/);
  const g = await fixture(t);
  await mkdir(join(g.root, ".local"));
  await symlink(outside.root, join(g.root, ".local/storybook"));
  await assert.rejects(g.run("start"), /Refusing symlink/);
});

test("maintenance serializes start and cache mutation across ports", async (t) => {
  const f = await fixture(t);
  let entered, release;
  const arrived = new Promise((resolve) => {
    entered = resolve;
  });
  const waiting = new Promise((resolve) => {
    release = resolve;
  });
  const preflight = f.ports.preflight;
  f.ports.preflight = async () => {
    entered();
    await waiting;
    return preflight();
  };
  const starting = f.run("start");
  await arrived;
  await assert.rejects(
    runStorybook(f.root, { action: "clean", port: 7491, apply: true }, f.ports),
    /maintenance is already running/,
  );
  release();
  await starting;
  await f.run("stop");
});

test("an abandoned lease is recovered only after its owner is confirmed absent", async (t) => {
  const f = await fixture(t),
    exited = spawnSync(process.execPath, ["-e", "process.exit(0)"]);
  assert.equal(exited.status, 0);
  assert.throws(() => process.kill(exited.pid, 0), { code: "ESRCH" });
  await mkdir(join(f.root, ".local/storybook"), { recursive: true });
  const lock = join(f.root, ".local/storybook/maintenance.lock");
  await writeFile(
    lock,
    JSON.stringify({ pid: exited.pid, nonce: "abandoned" }),
    { mode: 0o600 },
  );
  assert.equal((await f.run("clean")).apply, false);
  await assert.rejects(stat(lock), { code: "ENOENT" });
});

test("cache-consumer matching includes raw servers, tests and builds but excludes lifecycle wrappers", () => {
  for (const value of [
    "node ./node_modules/.bin/../storybook/dist/bin/dispatcher.js dev --port 7490",
    "node /root/storybook/dist/bin/dispatcher.js build",
    "node ./node_modules/.bin/../vitest/vitest.mjs run",
    "node /root/vite/bin/vite.js",
  ])
    assert.equal(usesCatalogCache(value), true, value);
  for (const value of [
    "pnpm storybook:clean",
    "node scripts/storybook.mjs clean",
    "node other.js",
    "python -m http.server --directory storybook-static",
  ])
    assert.equal(usesCatalogCache(value), false, value);
});
