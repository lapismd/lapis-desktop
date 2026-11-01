#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { validateManifest } from "./contract.mjs";
import { linuxBinary, verifyLinuxBundle } from "./verify-linux.mjs";

if (
  process.platform !== "linux" ||
  !["arm64", "x64"].includes(process.arch) ||
  process.env.GITHUB_ACTIONS !== "true" ||
  homedir() !== "/home/runner" ||
  !process.env.DISPLAY
)
  throw Error(
    "Linux installed-app smoke requires an ephemeral native GitHub runner with X11",
  );
const { values } = parseArgs({
  options: {
    app: { type: "string" },
    manifest: { type: "string" },
    output: { type: "string" },
  },
});
if (!values.app || !values.manifest || !values.output)
  throw Error("Require --app, --manifest and --output");
const manifest = validateManifest(
  JSON.parse(await readFile(values.manifest, "utf8")),
);
const target =
  process.arch === "arm64"
    ? "aarch64-unknown-linux-gnu"
    : "x86_64-unknown-linux-gnu";
const artifact = manifest.artifacts.find((a) => a.target === target);
assert.ok(artifact, "Manifest must include this native Linux target");
const app = await realpath(resolve(values.app));
const report = verifyLinuxBundle(app, manifest, target);
const path = await mkdtemp(join(tmpdir(), "lapis-ordinary-path-"));
let child,
  manager,
  exited,
  log = "";
const run = (name, args) =>
  execFileSync(`/usr/bin/${name}`, args, { encoding: "utf8", timeout: 10000 });
const pause = () => new Promise((done) => setTimeout(done, 250));
async function until(check, timeout) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const result = await check();
    if (result) return result;
    await pause();
  }
  throw Error(`Installed Linux application timed out. ${log.slice(-4000)}`);
}
try {
  manager = spawn("/usr/bin/openbox", [], { stdio: "ignore" });
  manager.on("error", (error) => {
    log += error.message;
  });
  await until(() => {
    try {
      return run("wmctrl", ["-m"]).includes("Name:");
    } catch {
      return false;
    }
  }, 15000);
  // Empty PATH is standard process environment isolation, not a product test hook.
  child = spawn(join(app, linuxBinary), [], {
    env: { ...process.env, PATH: path },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (bytes) => {
    log += bytes;
  });
  child.stderr.on("data", (bytes) => {
    log += bytes;
  });
  child.on("error", (error) => {
    log += error.message;
  });
  child.on("exit", (code, signal) => {
    exited = { code, signal };
  });
  const window = await until(async () => {
    if (exited)
      throw Error(
        `Ordinary Linux application exited before presenting a window: ${JSON.stringify(exited)} ${log}`,
      );
    assert.equal(
      await realpath(`/proc/${child.pid}/exe`),
      join(app, linuxBinary),
    );
    const rows = run("wmctrl", ["-lpG"]).trim().split("\n");
    for (const row of rows) {
      const [id, , pid, , , width, height] = row.trim().split(/\s+/);
      if (
        Number(pid) === child.pid &&
        Number(width) >= 640 &&
        Number(height) >= 480 &&
        /Map State: IsViewable/.test(run("xwininfo", ["-id", id]))
      )
        return id;
    }
    return false;
  }, 60000);
  run("wmctrl", ["-ic", window]);
  await until(() => exited, 30000);
  assert.deepEqual(
    exited,
    { code: 0, signal: null },
    "Normal window close must exit gracefully",
  );
  await mkdir(dirname(resolve(values.output)), { recursive: true });
  await writeFile(
    values.output,
    JSON.stringify(
      {
        ok: true,
        sourceCommit: manifest.sourceCommit,
        artifactSha256: artifact.sha256,
        ...report,
        pid: child.pid,
        visibleNativeWindow: true,
        gracefulQuit: true,
        nodeDenoOnPath: false,
        boundary:
          "Installed ordinary Linux app startup/window/quit; full Linux native feature parity remains unqualified",
      },
      null,
      2,
    ) + "\n",
  );
} finally {
  if (child && !exited) child.kill("SIGKILL");
  manager?.kill("SIGTERM");
  await rm(path, { recursive: true, force: true });
}
