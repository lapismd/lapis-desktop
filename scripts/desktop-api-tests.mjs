import { run } from "./desktop-acceptance.mjs";
const flags = process.argv.slice(2);
if (
  flags.length > 1 ||
  (flags.length === 1 && !["--onnx", "--sync"].includes(flags[0]))
)
  throw new Error("Choose the ordinary API lane, --onnx or --sync.");
if (process.env.LAPIS_DESKTOP_NATIVE_LANE !== "1")
  throw new Error(
    "Native API qualification requires the explicit macOS lane dispatcher.",
  );
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
// Compile OS-conditional source and both host configurations before IPC execution.
for (const args of [
  [
    "clippy",
    "--manifest-path",
    "src-tauri/Cargo.toml",
    "--all-targets",
    "--locked",
    "--",
    "-D",
    "warnings",
  ],
  [
    "clippy",
    "--manifest-path",
    "src-tauri/Cargo.toml",
    "--all-targets",
    "--features",
    "e2e",
    "--locked",
    "--",
    "-D",
    "warnings",
  ],
  [
    "build",
    "--manifest-path",
    "src-tauri/Cargo.toml",
    "--bin",
    "lapis-desktop",
    "--locked",
  ],
])
  await run("cargo", args, environment);
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
    "--import",
    "tsx",
    "--test",
    "--test-concurrency=1",
    ...(flags[0] === "--sync"
      ? []
      : [
          "tests/desktop/core-file-service.test.mjs",
          "tests/desktop/editing-owner.test.mjs",
          "tests/desktop/tasks-owner.test.mjs",
          "tests/desktop/metadata-owner.test.mjs",
          "tests/desktop/search-owner.test.mjs",
          "tests/desktop/search-provider.test.mjs",
          "tests/desktop/ai-admission.test.mjs",
          "tests/desktop/ai-turn-owner.test.mjs",
          "tests/desktop/ai-native-queue-admission.test.mjs",
          "tests/desktop/ai-native-queue-owner.test.mjs",
          "tests/desktop/repository-admission.test.mjs",
          "tests/desktop/repository-service-lifetime.test.mjs",
          "tests/desktop/repository-indexed-search.test.mjs",
          "tests/desktop/repository-backup-recovery.test.mjs",
          "tests/desktop/repository-backup-resume.test.mjs",
        ]),
    "tests/desktop/sync-account.test.mjs",
    "tests/desktop/sync-custody.test.mjs",
    ...(flags[0] === "--onnx" ? ["tests/desktop/search-onnx.test.mjs"] : []),
  ],
  environment,
);
