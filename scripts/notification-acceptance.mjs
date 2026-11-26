import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname, isAbsolute } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { nativeLaneGate } from "./macos-native-lanes.mjs";
import { notificationSession } from "../tests/desktop/notification-session.mjs";

const gate = nativeLaneGate();
if (!gate.ok) throw Error(gate.reason);
if (process.argv.length !== 2)
  throw Error("Notification acceptance takes no arguments");
const binary = process.env.LAPIS_DESKTOP_ACCEPTANCE_BINARY;
const receiptPath = process.env.LAPIS_NOTIFICATION_ACCEPTANCE_RECEIPT;
if (!binary || !isAbsolute(binary) || !receiptPath || !isAbsolute(receiptPath))
  throw Error("Provide the isolated acceptance binary and its build receipt");
const build = JSON.parse(readFileSync(receiptPath, "utf8"));
assert.equal(
  createHash("sha256").update(readFileSync(binary)).digest("hex"),
  build.binarySha256,
);
const bundle = dirname(dirname(dirname(binary)));
const identifier = execFileSync(
  "/usr/libexec/PlistBuddy",
  ["-c", "Print :CFBundleIdentifier", join(bundle, "Contents/Info.plist")],
  { encoding: "utf8" },
).trim();
assert.equal(identifier, build.bundleId);
assert.match(
  identifier,
  /^com\.lapismd\.lapis-desktop\.acceptance\.notifications\.r\d+a\d+$/u,
);
execFileSync("/usr/bin/codesign", ["--verify", "--deep", "--strict", bundle]);
const root = mkdtempSync(join(tmpdir(), "lapis-notification-acceptance-"));
process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT = root;
const receipt = {
  schema: 1,
  build,
  root,
  platform: process.platform,
  arch: process.arch,
  macOS: execFileSync("/usr/bin/sw_vers", ["-productVersion"], {
    encoding: "utf8",
  }).trim(),
  startedAt: new Date().toISOString(),
  steps: [],
  passed: false,
};
const save = () =>
  writeFileSync(
    join(root, "notification-receipt.json"),
    JSON.stringify(receipt, null, 2),
  );
let session;
const status = () =>
  session.browser.execute(() =>
    globalThis.__TAURI__.core.invoke("notification_acceptance", {
      action: "status",
    }),
  );
const job = () =>
  session.browser.execute(() =>
    globalThis.__TAURI__.core.invoke("notification_acceptance", {
      action: "job",
    }),
  );
async function deliveredAfter(before) {
  const end = Date.now() + 10000;
  while (Date.now() < end) {
    const current = await status();
    const delivered = current.deliveredIds.filter((id) => !before.includes(id));
    if (delivered.length) {
      assert.equal(delivered.length, 1);
      return current;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw Error("Notification Center did not report delivery within ten seconds");
}
try {
  session = await notificationSession("notification-permission", root, binary);
  const initial = await status();
  assert.equal(
    initial.authorization,
    "NotDetermined",
    "Use a fresh build identity; permission is never reset automatically",
  );
  await assert.rejects(job(), /Notifications are disabled/u);
  assert.equal((await status()).authorization, "NotDetermined");
  receipt.steps.push({
    name: "Unattended delivery did not request permission",
    status: "passed",
  });
  save();
  console.log(
    "Allow the isolated Lapis Notification Acceptance app in the macOS permission prompt.",
  );
  await session.browser.execute(() =>
    globalThis.__TAURI__.core.invoke("desktop_notify", {
      notification: {
        id: "notification-acceptance-foreground",
        title: "Lapis notification acceptance",
        message: "Explicit foreground permission acceptance.",
        severity: "info",
      },
    }),
  );
  const foreground = await deliveredAfter(initial.deliveredIds);
  assert.ok(["Authorized", "Provisional"].includes(foreground.authorization));
  receipt.steps.push({
    name: "Explicit foreground permission and OS delivery",
    status: "passed",
    authorization: foreground.authorization,
  });
  save();
  await job();
  const background = await deliveredAfter(foreground.deliveredIds);
  receipt.steps.push({
    name: "Production background-job sink reached Notification Center",
    status: "passed",
    delivered: background.deliveredIds.length - foreground.deliveredIds.length,
  });
  save();
  await session.close();
  await session.cleanup();
  session = await notificationSession("notification-cold", root, binary);
  const cold = await status();
  assert.equal(cold.authorization, foreground.authorization);
  await job();
  await deliveredAfter(cold.deliveredIds);
  receipt.steps.push({
    name: "Authorized cold-process job delivery",
    status: "passed",
  });
  await session.browser.execute(() =>
    globalThis.__TAURI__.core.invoke("notification_acceptance", {
      action: "clear",
    }),
  );
  assert.equal((await status()).deliveredIds.length, 0);
  await session.close();
  receipt.passed = true;
} catch (error) {
  receipt.error = error.message;
  throw error;
} finally {
  await session?.cleanup();
  receipt.finishedAt = new Date().toISOString();
  save();
  console.log(
    `Notification acceptance receipt: ${join(root, "notification-receipt.json")}`,
  );
}
