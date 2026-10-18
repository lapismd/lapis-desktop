import { spawn } from "node:child_process";
import { open, realpath, access } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { setTimeout as pause } from "node:timers/promises";
import {
  inspectProcess,
  listeners,
  cacheConsumers,
} from "./storybook-process.mjs";
import {
  safePath,
  withLease,
  cleanCaches,
  preflightLog,
} from "./storybook-files.mjs";
import { PreviewOwner, previewArgs } from "./storybook-owner.mjs";

export function parseOptions(args, env = process.env) {
  const [action, ...flags] = args.filter((arg) => arg !== "--");
  if (!["start", "stop", "restart", "status", "clean"].includes(action))
    throw new Error("Choose start, stop, restart, status or clean");
  let port = env.LAPIS_STORYBOOK_PORT ?? "7480",
    apply = false,
    portSet = false;
  for (let n = 0; n < flags.length; n++) {
    if (flags[n] === "--port" && !portSet && flags[n + 1]) {
      port = flags[++n];
      portSet = true;
    } else if (flags[n] === "--apply" && action === "clean" && !apply)
      apply = true;
    else throw new Error(`Unknown or repeated preview option: ${flags[n]}`);
  }
  if (!/^\d+$/.test(port) || Number(port) < 1024 || Number(port) > 65535)
    throw new Error("Preview port must be 1024–65535");
  return { action, port: Number(port), apply };
}
async function preflight(root) {
  const require = createRequire(join(root, "package.json"));
  const manifest = require.resolve("storybook/package.json"),
    pkg = require(manifest);
  const entry = join(
    dirname(manifest),
    typeof pkg.bin === "string" ? pkg.bin : pkg.bin.storybook,
  );
  for (const path of [
    entry,
    join(root, ".storybook/main.ts"),
    join(root, "vite.catalog.config.ts"),
  ])
    await access(path);
  return entry;
}
async function launch(root, port, log, entry) {
  const file = await open(log, "a", 0o600);
  try {
    const child = spawn(process.execPath, [entry, ...previewArgs(port)], {
      cwd: root,
      stdio: ["ignore", file.fd, file.fd],
      detached: true,
    });
    await new Promise((resolve, reject) => {
      child.once("spawn", resolve);
      child.once("error", reject);
    });
    child.unref();
    return child;
  } finally {
    await file.close();
  }
}
async function ready(port) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/index.json`, {
      signal: AbortSignal.timeout(2000),
      redirect: "error",
    });
    if (!response.ok) return false;
    const data = await response.json();
    return !!data.entries && typeof data.entries === "object";
  } catch {
    return false;
  }
}
export const system = {
  inspect: inspectProcess,
  listeners,
  consumers: cacheConsumers,
  preflight,
  launch,
  ready,
  pause,
  signal: (pid) => process.kill(pid, "SIGTERM"),
};
export async function runStorybook(root, options, ports = system) {
  const { action, port, apply } = options;
  if (
    !["start", "stop", "restart", "status", "clean"].includes(action) ||
    !Number.isInteger(port) ||
    port < 1024 ||
    port > 65535
  )
    throw new Error("Invalid preview command");
  root = await realpath(root);
  const owner = new PreviewOwner(
    root,
    port,
    await safePath(root, `.local/storybook/${port}.json`),
    ports,
  );
  async function start(entry) {
    const current = await owner.status();
    if (current.state === "running") return current;
    if (current.state !== "stopped")
      throw new Error(
        `Preview port ${port} is ${current.state}; inspect status before starting`,
      );
    if (current.record) await owner.erase(current.record);
    const log = await preflightLog(root, port);
    const child = await ports.launch(root, port, log, entry);
    let observed, record;
    try {
      const identityDeadline = performance.now() + 5_000;
      for (
        let n = 0;
        n < 100 && !observed && performance.now() < identityDeadline;
        n++
      ) {
        observed = await ports.inspect(child.pid);
        if (!observed) await ports.pause(50);
      }
      if (!observed)
        throw new Error("Cannot establish started preview ownership");
      record = owner.claim(observed, entry);
      await owner.save(record);
      const readyDeadline = performance.now() + 30_000;
      for (let n = 0; n < 120 && performance.now() < readyDeadline; n++) {
        const current = await owner.status();
        if (current.state === "running") return { ...current, log };
        if (current.state === "foreign" || !current.pid)
          throw new Error("Started preview lost its process or port");
        await ports.pause(250);
      }
      throw new Error(`Preview startup did not finish; see ${log}`);
    } catch (error) {
      try {
        if (record) await owner.halt(record);
        else if (child.exitCode === null) child.kill("SIGTERM");
      } catch (cleanup) {
        throw new AggregateError(
          [error, cleanup],
          `Preview startup/cleanup failed; inspect ${owner.path}`,
        );
      }
      throw error;
    }
  }
  if (action === "status") {
    const { record, ...view } = await owner.status();
    return view;
  }
  return withLease(root, async () => {
    if (action === "clean") return cleanCaches(root, apply, ports.consumers);
    const entry =
      action === "start" || action === "restart"
        ? await ports.preflight(root)
        : undefined;
    if (entry) await preflightLog(root, port);
    if (action === "restart") await owner.stop();
    const { record, ...view } =
      action === "stop" ? await owner.stop() : await start(entry);
    return view;
  });
}
