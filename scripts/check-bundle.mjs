import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, join, relative } from "node:path";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";

if (process.platform !== "darwin")
  throw new Error("The current bundle gate qualifies macOS only.");
const configuration = JSON.parse(
  readFileSync("src-tauri/tauri.conf.json", "utf8"),
);
const bundle = resolve(
  process.argv[2] ??
    `src-tauri/target/debug/bundle/macos/${configuration.productName}.app`,
);
const plist = join(bundle, "Contents/Info.plist");
const readPlist = (key) =>
  execFileSync("/usr/libexec/PlistBuddy", ["-c", `Print :${key}`, plist], {
    encoding: "utf8",
  }).trim();
assert.equal(readPlist("CFBundleIdentifier"), configuration.identifier);
const executable = join(
  bundle,
  "Contents/MacOS",
  readPlist("CFBundleExecutable"),
);
const architectures = execFileSync("/usr/bin/lipo", ["-archs", executable], {
  encoding: "utf8",
}).trim();
assert.equal(architectures, "arm64");
const bytes = readFileSync(executable);
for (const marker of [
  "TAURI_WEBDRIVER_PORT",
  "wdioTauri",
  "__wdio_mocks__",
  "__lapisPluginAcceptance",
  "__lapisAcpAcceptance",
  "acp_acceptance_control",
  "LAPIS_ACP_FIXTURE_LOG",
  "__lapisDistributionAcceptance",
  "__LAPIS_DISTRIBUTION_FIXTURE__",
  "native-install-acceptance",
  "native-install.invalid",
  "LAPIS_DESKTOP_ACCEPTANCE_",
  "__lapisNativeDatabaseAcceptance",
  "__lapisConditionalWriteAcceptance",
  "__lapisNativeWatchAcceptance",
  "file-actions.jsonl",
  "integration-actions.jsonl",
  "Integration receipt unavailable",
  "Acceptance action receipt unavailable",
  "Native controls could not be measured",
  "Native visibility could not be measured",
  "LAPIS_DESKTOP_POPOUT_PROOF",
  "Related native window proof failed",
  "popout-proof-",
  "__lapisPopoutProof",
  "nativeChromeObservers",
  "popoutProofMode",
  "LAPIS_POPOUT_PROOF:",
])
  assert.equal(
    bytes.includes(Buffer.from(marker)),
    false,
    `Normal binary includes automation marker ${marker}`,
  );
function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink())
      throw new Error(`Unexpected bundled symlink: ${path}`);
    return entry.isDirectory() ? files(path) : [path];
  });
}
const bundleFiles = files(bundle).map((path) => relative(bundle, path));
assert.ok(
  bundleFiles.every(
    (path) => !/(?:^|\/)(?:node|deno|wdio)(?:[./-]|$)/iu.test(path),
  ),
);
const rendererFiles = files(resolve("dist")).filter((path) =>
  path.endsWith(".js"),
);
assert.ok(
  bundleFiles.every(
    (path) => !/lapis-acp-native-fixture|acp-peer\.jsonl/u.test(path),
  ),
);
assert.ok(rendererFiles.length > 0);
for (const path of rendererFiles)
  assert.doesNotMatch(
    readFileSync(path, "utf8"),
    /wdioTauri|__wdio_mocks__|TAURI_WEBDRIVER_PORT|__lapisAcpAcceptance|__lapisNativeDatabaseAcceptance|__lapisNativeWatchAcceptance|__lapisConditionalWriteAcceptance|__lapisPopoutProof|__lapisDistributionAcceptance|__LAPIS_DISTRIBUTION_FIXTURE__|native-install-acceptance|native-install\.invalid/u,
  );
const report = {
  result: "pass",
  bundle,
  identifier: configuration.identifier,
  architectures,
  signing: "deferred",
  bundledFiles: bundleFiles,
  rendererJavaScriptFiles: rendererFiles.length,
  normalAutomationMarkers: 0,
};
mkdirSync(".local", { recursive: true });
writeFileSync(
  ".local/bundle-check.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
