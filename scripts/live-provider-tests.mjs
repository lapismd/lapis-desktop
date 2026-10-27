#!/usr/bin/env node
/**
 * The only entry point for live agent/provider acceptance.
 *
 * Every spec listed here drives a real installed agent or provider, so it is
 * excluded from all default lanes: the quiet `pnpm test` suite, the headless and
 * headed desktop lanes, the hidden API lane, the catalog lanes and both bundle
 * configurations. `tests/governance/live-provider-exclusion.test.mjs` keeps that
 * exclusion structural rather than a runtime convention, and this runner refuses
 * to start without an explicit request.
 *
 * User decision 2026-10-27: live provider acceptance is optional and runs only
 * on explicit request. When it does run, the fresh-receipt rules stand: preserve
 * receipts, record a failed attempt before any deliberate retry, never auto-replay
 * an uncertain accepted turn and never print configuration or credential content.
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { run } from "./desktop-acceptance.mjs";

/** Live agent/provider specs. No default lane may reference these. */
export const liveProviderSpecs = [
  "tests/desktop/ai-core-provider-screen.test.mjs",
  "tests/desktop/ai-core-provider.test.mjs",
  "tests/desktop/ai-local-comments.test.mjs",
  "tests/desktop/ai-local-compute-lifecycle.test.mjs",
  "tests/desktop/ai-local-discussions.test.mjs",
  "tests/desktop/ai-local-multi.test.mjs",
  "tests/desktop/ai-local-queue.test.mjs",
  "tests/desktop/ai-local-recovery.test.mjs",
  "tests/desktop/ai-local-streaming.test.mjs",
  "tests/desktop/ai-local-tools.test.mjs",
  "tests/desktop/ai-native-queue-provider.test.mjs",
  "tests/desktop/ai-provider-matrix.test.mjs",
];

/** Helpers only live specs import; excluded from default lanes as well. */
export const liveProviderHelpers = [
  "tests/desktop/ai-local-compute-fixture.mjs",
  "tests/desktop/ai-provider-fixture.mjs",
  "tests/desktop/native-queue-provider/driver.mjs",
];

/** Environment names that select a real agent/provider over a local fixture. */
export const liveProviderEnvironment = [
  "LAPIS_AI_TEST_RUNTIME_CONFIG",
  "LAPIS_AI_TEST_CORE_QUEUE_PROVIDER",
  "LAPIS_AI_TEST_CLIENTS",
  "LAPIS_AI_TEST_GGUF",
];

/** Pure opt-in gate so the governance audit can assert the refusal itself. */
export function liveProviderGate(environment = process.env) {
  const configuration = environment.LAPIS_AI_TEST_RUNTIME_CONFIG;
  if (!configuration)
    return {
      ok: false,
      reason:
        "Live agent/provider acceptance needs an explicit LAPIS_AI_TEST_RUNTIME_CONFIG; default lanes never run these specs.",
    };
  if (!existsSync(resolve(configuration)))
    return {
      ok: false,
      reason: "The selected runtime configuration does not exist.",
    };
  return {
    ok: true,
    reason: null,
    requested: Object.keys(environment).filter((key) =>
      liveProviderEnvironment.includes(key),
    ),
  };
}

function selected(argv) {
  const args = argv.filter((argument) => argument !== "--");
  if (!args.length)
    throw new Error(
      "Name the live specs to run, or pass --all for the complete opt-in inventory.",
    );
  if (args[0] === "--all") return [...liveProviderSpecs];
  for (const argument of args)
    if (!liveProviderSpecs.includes(argument))
      throw new Error(
        `${argument} is not a live agent/provider spec; this runner never executes an unlisted test.`,
      );
  return args;
}

async function live() {
  if (process.platform !== "darwin" || process.arch !== "arm64")
    throw new Error("Live native provider acceptance requires macOS ARM64.");
  const gate = liveProviderGate();
  if (!gate.ok) throw new Error(gate.reason);
  const specs = selected(process.argv.slice(2));
  for (const spec of specs)
    if (!existsSync(resolve(spec)))
      throw new Error(`Missing live spec ${spec}`);
  console.log(
    "Explicitly requested live agent/provider acceptance; this is never part of a default lane.",
  );
  console.log(
    `Selected ${specs.length} of ${liveProviderSpecs.length} live specs; each keeps its own opt-in skip guard.`,
  );
  console.log(
    "Opt-in environment present: " +
      (gate.requested.length ? gate.requested.join(", ") : "none") +
      ". Preserve receipts, record a failed attempt before any deliberate retry, never auto-replay an uncertain accepted turn and never print configuration or credential content.",
  );
  await run(
    process.execPath,
    ["--import", "tsx", "--test", "--test-concurrency=1", ...specs],
    {
      ...process.env,
      MACOSX_DEPLOYMENT_TARGET: "13.0",
      CARGO_BUILD_JOBS: "2",
    },
  );
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  live().catch((error) => {
    console.error(error.message ?? error);
    process.exitCode = 1;
  });
