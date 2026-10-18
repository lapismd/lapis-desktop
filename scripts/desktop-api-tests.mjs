import { run } from "./desktop-acceptance.mjs";
if (process.platform !== "darwin" || process.arch !== "arm64")
  throw new Error("Background native API qualification requires macOS ARM64.");
const environment = {
  ...process.env,
  MACOSX_DEPLOYMENT_TARGET: "13.0",
  CARGO_BUILD_JOBS: "2",
};
console.log(
  "Background native API acceptance; this does not qualify visible UI or animation behavior.",
);
await run(
  process.execPath,
  ["scripts/prepare-acp-acceptance.mjs"],
  environment,
);
await run(
  "pnpm",
  [
    "exec",
    "tauri",
    "build",
    "--debug",
    "--bundles",
    "app",
    "--features",
    "e2e",
    "--config",
    "src-tauri/tauri.e2e.conf.json",
  ],
  environment,
);
await run(
  process.execPath,
  [
    "--test",
    "--test-concurrency=1",
    "tests/desktop/ai-admission.test.mjs",
    "tests/desktop/ai-backends.test.mjs",
    "tests/desktop/repository-admission.test.mjs",
  ],
  environment,
);
