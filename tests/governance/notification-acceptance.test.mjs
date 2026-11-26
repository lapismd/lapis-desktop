import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { parse } from "yaml";

const read = (path) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("notification acceptance builds only on an explicit manual request", () => {
  const workflow = parse(read(".github/workflows/ci.yml"));
  assert.equal(
    workflow.on.workflow_dispatch.inputs.notification_acceptance.default,
    false,
  );
  const steps = workflow.jobs.bundle.steps;
  const build = steps.find(
    (step) => step.run === "node scripts/build-notification-acceptance.mjs",
  );
  assert.match(
    build.if,
    /github.event_name == 'workflow_dispatch' && inputs.notification_acceptance/u,
  );
  const artifact = steps.find((step) =>
    step.with?.name?.startsWith("notification-acceptance-"),
  );
  assert.equal(artifact.if, build.if);
  assert.equal(artifact.with["if-no-files-found"], "error");
});

test("notification inspection is e2e-only and restricted to its dedicated bundle", () => {
  assert.match(
    read("src-tauri/build.rs"),
    /#\[cfg\(feature = "e2e"\)\]\s*"notification_acceptance"/u,
  );
  assert.match(
    read("src-tauri/src/host/mod.rs"),
    /#\[cfg\(feature = "e2e"\)\]\s*crate::acceptance::notifications::notification_acceptance/u,
  );
  const hook = read("src-tauri/src/acceptance/notifications.rs");
  assert.match(
    hook,
    /com\.lapismd\.lapis-desktop\.acceptance\.notifications\./u,
  );
  assert.match(hook, /get_delivered_notification_ids/u);
  assert.match(hook, /integration::services::job_delivery/u);
  const builder = read("scripts/build-notification-acceptance.mjs");
  assert.match(builder, /config\.bundle\.resources = \[\]/u);
  assert.match(builder, /binarySha256/u);
});

test(
  "notification artifact construction refuses non-macOS hosts",
  { skip: process.platform === "darwin" },
  () => {
    const child = spawnSync(
      process.execPath,
      ["scripts/build-notification-acceptance.mjs"],
      { encoding: "utf8" },
    );
    assert.notEqual(child.status, 0);
    assert.match(child.stderr, /requires macOS ARM64/u);
  },
);
