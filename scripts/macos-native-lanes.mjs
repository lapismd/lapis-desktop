#!/usr/bin/env node
/**
 * On-demand macOS native lane dispatcher.
 *
 * Docker is the default validation runtime for every standard lane, which is the
 * portable lane set CI runs. The lanes inventoried here need the actual macOS
 * WebView, window, OS actions or a real installed agent, so no default lane may
 * collect them and they start only behind an explicit request.
 * `tests/governance/native-lane-defaults.test.mjs` keeps this inventory, the
 * refusals and the Docker default structural inside the default test lane, so a
 * future lane edit cannot silently re-add native-default collection.
 *
 * User decision 2026-10-27: macOS native/headed acceptance and live
 * agent/provider acceptance are explicit-request-only on-demand lanes. Fresh
 * receipt rules still apply when they run.
 */
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Explicit opt-in that unlocks the on-demand macOS lanes. */
export const nativeLaneOptIn = "LAPIS_DESKTOP_NATIVE_LANE";

/**
 * Every macOS-only lane, with the manifest script that owns it. `delegate`
 * lanes keep their own stricter gate and arguments.
 */
export const macosNativeLanes = [
  {
    name: "headed",
    script: "test:desktop:headed",
    needs: "actual native WebView, window and OS actions",
  },
  {
    name: "api",
    script: "test:desktop:api",
    needs: "hidden native WebView IPC without activation",
  },
  {
    name: "onnx",
    script: "test:desktop:onnx",
    needs: "a real ONNX model inside the hidden native WebView",
  },
  {
    name: "provider-live",
    script: "test:provider:live",
    delegate: "scripts/live-provider-tests.mjs",
    needs: "a real installed agent/provider; keeps its own opt-in gate",
  },
];

/** Pure gate so the governance audit can assert each refusal itself. */
export function nativeLaneGate(
  environment = process.env,
  platform = process.platform,
  arch = process.arch,
) {
  if (environment[nativeLaneOptIn] !== "1")
    return {
      ok: false,
      reason: `On-demand macOS native lanes need an explicit ${nativeLaneOptIn}=1; Docker stays the default runtime for every standard lane.`,
    };
  if (platform !== "darwin" || arch !== "arm64")
    return {
      ok: false,
      reason: "On-demand macOS native lanes require macOS ARM64.",
    };
  return { ok: true, reason: null };
}

export function selectNativeLane(argv, lanes = macosNativeLanes) {
  const args = argv.filter((argument) => argument !== "--");
  if (!args.length)
    throw new Error(
      `Name one on-demand lane: ${lanes.map((lane) => lane.name).join(", ")}.`,
    );
  const lane = lanes.find((candidate) => candidate.name === args[0]);
  if (!lane)
    throw new Error(
      `${args[0]} is not an inventoried macOS native lane; this dispatcher never runs an unlisted command.`,
    );
  return { lane, passthrough: args.slice(1) };
}

function dispatch(command, args, env) {
  return new Promise((accept, reject) => {
    const child = spawn(command, args, { stdio: "inherit", env });
    const stop = () => child.kill("SIGTERM");
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      process.removeListener("SIGINT", stop);
      process.removeListener("SIGTERM", stop);
      if (code === 0) accept();
      else
        reject(
          new Error(`${command} ${args.join(" ")} exited ${signal ?? code}`),
        );
    });
  });
}

async function main() {
  const gate = nativeLaneGate();
  if (!gate.ok) throw new Error(gate.reason);
  const { lane, passthrough } = selectNativeLane(process.argv.slice(2));
  console.log(
    `Explicitly requested on-demand macOS lane "${lane}" (${lane.needs}); Docker remains the default runtime for standard lanes.`,
  );
  console.log(
    "Preserve fresh receipts, record a failed attempt before any deliberate retry, and never present an on-demand native run as Docker CI parity.",
  );
  await dispatch(
    lane.delegate ? process.execPath : "pnpm",
    lane.delegate
      ? [lane.delegate, ...passthrough]
      : [lane.script, ...passthrough],
    {
      ...process.env,
      LAPIS_DESKTOP_VALIDATION_RUNTIME: "native",
      MACOSX_DEPLOYMENT_TARGET: "13.0",
      CARGO_BUILD_JOBS: "2",
    },
  );
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main().catch((error) => {
    console.error(error.message ?? error);
    process.exitCode = 1;
  });
