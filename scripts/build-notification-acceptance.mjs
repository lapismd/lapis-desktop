// Build only. OS acceptance runs separately on the explicitly selected local Mac.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { nativeBuildEnvironment } from "./validation/model.mjs";

if (process.platform !== "darwin" || process.arch !== "arm64")
  throw Error("Notification acceptance artifact requires macOS ARM64");
const run = process.env.GITHUB_RUN_ID ?? String(Date.now());
const attempt = process.env.GITHUB_RUN_ATTEMPT ?? "1";
if (!/^\d+$/.test(run) || !/^\d+$/.test(attempt))
  throw Error("Invalid artifact identity");
const directory = resolve(".local/notification-acceptance");
mkdirSync(directory, { recursive: true });
const config = JSON.parse(
  readFileSync("src-tauri/tauri.e2e.conf.json", "utf8"),
);
config.productName = "Lapis Notification Acceptance";
config.identifier = `com.lapismd.lapis-desktop.acceptance.notifications.r${run}a${attempt}`;
// Notification delivery needs the production bootstrap, not distribution fixtures.
config.build.beforeBuildCommand =
  "pnpm exec vite build --mode native-jobs-test --outDir .local/native-test/ui";
// Optional AI fixtures are irrelevant to this isolated OS boundary.
config.bundle.resources = [];
config.app.security.capabilities.push({
  identifier: "notification-acceptance",
  local: true,
  windows: ["main"],
  permissions: ["allow-notification-acceptance"],
});
const configuration = `${directory}/tauri.notifications.json`;
writeFileSync(configuration, JSON.stringify(config));
execFileSync(
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
    JSON.stringify(config),
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      ...nativeBuildEnvironment("build"),
      CARGO_PROFILE_DEV_DEBUG: "0",
      CARGO_PROFILE_DEV_STRIP: "debuginfo",
    },
  },
);
const bundle =
  "src-tauri/target/debug/bundle/macos/Lapis Notification Acceptance.app";
const binary = `${bundle}/Contents/MacOS/lapis-desktop`;
const source = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
writeFileSync(
  `${directory}/receipt.json`,
  JSON.stringify(
    {
      schema: 1,
      source,
      run,
      attempt,
      bundleId: config.identifier,
      binarySha256: createHash("sha256")
        .update(readFileSync(binary))
        .digest("hex"),
    },
    null,
    2,
  ),
);
execFileSync(
  "tar",
  [
    "-czf",
    `${directory}/app.tar.gz`,
    "-C",
    "src-tauri/target/debug/bundle/macos",
    "Lapis Notification Acceptance.app",
  ],
  { stdio: "inherit" },
);
