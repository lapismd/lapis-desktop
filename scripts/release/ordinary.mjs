import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

export function bundleFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink())
      throw Error(`Unexpected bundle symlink: ${path}`);
    if (entry.isDirectory()) return bundleFiles(path);
    if (!entry.isFile()) throw Error(`Unexpected bundle resource: ${path}`);
    return [path];
  });
}

export function verifyOrdinary(directory, executable) {
  const files = bundleFiles(directory);
  for (const path of files)
    assert.doesNotMatch(
      relative(directory, path),
      /(?:^|\/)(?:node|deno|wdio)(?:[./-]|$)|lapis-acp-native-fixture|acp-peer\.jsonl/i,
    );
  const bytes = readFileSync(executable);
  for (const marker of [
    "TAURI_WEBDRIVER_PORT",
    "wdioTauri",
    "__wdio_mocks__",
    "__lapisPluginAcceptance",
    "__lapisTasksAcceptance",
    "__lapisAcpAcceptance",
    "__lapisShellStartupAcceptance",
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
    "restore-response-loss.arm",
    "Acceptance restore response lost after native receipt",
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
    assert.ok(
      !bytes.includes(Buffer.from(marker)),
      `Ordinary app contains acceptance driver: ${marker}`,
    );
  return files;
}
