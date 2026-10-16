import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { join, resolve } from "node:path";
import assert from "node:assert/strict";
import { acceptanceBinary } from "../../scripts/native-acceptance-binary.mjs";

/** Retain Wry's actual WKUIDelegate; the embedded WebDriver replaces it. */
export async function runPopoutProcess(root, mode) {
  const log = createWriteStream(join(root, "native-popout.log"));
  const child = spawn(
    acceptanceBinary(
      resolve(
        "src-tauri/target/debug/bundle/macos/Lapis Notes Acceptance.app/Contents/MacOS/lapis-desktop",
      ),
    ),
    [],
    {
      env: {
        ...process.env,
        PATH: "/usr/bin:/bin",
        LAPIS_DESKTOP_ACCEPTANCE_ROOT: root,
        LAPIS_DESKTOP_ACCEPTANCE_STATE: join(root, "window-state.json"),
        LAPIS_DESKTOP_POPOUT_PROOF: mode,
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let output = "";
  for (const stream of [child.stdout, child.stderr]) {
    stream.pipe(log, { end: false });
    stream.on("data", (chunk) => {
      output = (output + chunk.toString()).slice(-100000);
    });
  }
  const timer = setTimeout(() => child.kill("SIGKILL"), 45000);
  try {
    const exit = await new Promise((resolveExit, reject) => {
      child.once("error", reject);
      child.once("exit", (code, signal) => resolveExit({ code, signal }));
    });
    assert.deepEqual(exit, { code: 0, signal: null }, output.slice(-4000));
    const receipt = output.match(/LAPIS_POPOUT_PROOF:(\{[^\n]+\})/u);
    assert.ok(receipt, `Missing native proof receipt: ${output.slice(-4000)}`);
    const result = JSON.parse(receipt[1]);
    assert.equal(result.result, "pass", JSON.stringify(result));
    return result;
  } finally {
    clearTimeout(timer);
    log.end();
    if (child.exitCode === null && child.signalCode === null)
      child.kill("SIGKILL");
  }
}
