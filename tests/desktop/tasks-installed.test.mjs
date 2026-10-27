import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  taskFixture,
  hostedTask,
  title,
  taskCall,
  taskRecords,
  text,
  planner,
  complete,
  completedSubmit,
  noReplay,
  configured,
  coldTasks,
  editSource,
  inspectInterrupted,
  visibleText,
} from "./tasks-installed-driver.mjs";

test("real installed Tasks drains the real source editor before one native completion and cold Logbook", async (context) => {
  const f = await taskFixture(context, "tasks-installed-editor");
  const path = join(f.vault, "Hosted.md");
  const draft = hostedTask + "\nRetained real native editor draft.\n";
  try {
    await taskCall(f.browser, "holdNextSave", "Hosted.md");
    await editSource(f.browser, draft);
    await f.browser.waitUntil(
      async () =>
        (await taskCall(f.browser, "snapshot")).held === "save:Hosted.md",
    );
    await planner(f.browser);
    await complete(f.browser).waitForDisplayed();
    await complete(f.browser).click();
    assert.equal(text(path), hostedTask);
    await noReplay(f.browser, 0);
    await taskCall(f.browser, "release");
    const operation = await completedSubmit(f.browser);
    await f.browser.waitUntil(() => text(path).includes("status: completed"));
    assert.equal(text(path), operation.task_replacement);
    assert.ok(text(path).includes("Retained real native editor draft."));
    await noReplay(f.browser, 1);
    await f.session.close();
    const cold = await coldTasks(
      context,
      f.root,
      "tasks-installed-editor-cold",
    );
    await planner(cold.browser, "Logbook");
    await visibleText(cold.browser, title);
    await noReplay(cold.browser, 0);
    assert.equal(text(path), operation.task_replacement);
    await cold.close();
  } finally {
    if (f.session.isRunning()) await taskCall(f.browser, "release");
  }
});

test("installed native Tasks uses actual locale and daily policy and refuses unsupported provider callbacks", async (context) => {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const raw = `---
type: task
id: tracked
task:
  status: open
  start: anytime
  plan:
    date: ${today}
    at: morning
  repeat:
    start: ${today}
    rrule: FREQ=DAILY
    anchor: schedule
    missed: skip
  tracking:
    type: boolean
---

# A tracked habit

Authored Task content.
`;
  const f = await taskFixture(context, "tasks-installed-daily", {
    "Habit.md": raw,
  });
  const path = join(f.vault, "Habit.md");
  const daily = join(f.vault, `daily/${today}.md`);
  try {
    const actual = await taskCall(f.browser, "context");
    assert.equal(
      actual.today,
      today,
      "Operator and actual WebView local dates must agree",
    );
    const status = await configured(f.browser);
    assert.deepEqual(status.configuration.format, actual.format);
    assert.deepEqual(status.configuration.daily, {
      folder: "daily",
      date_format: "yyyy-MM-dd",
    });
    await f.browser.waitUntil(
      async () =>
        (await taskCall(f.browser, "status")).status.tracked?.date === today,
    );
    await f.browser.waitUntil(() =>
      text(daily).includes(`task=tracked date=${today} kind=boolean`),
    );
    assert.equal(text(path), raw);
    await planner(f.browser, "Today");
    await complete(f.browser, "A tracked habit").waitForDisplayed();
    const initialDaily = text(daily);
    await taskCall(f.browser, "customProvider", true);
    await configured(f.browser, "unavailable");
    await complete(f.browser, "A tracked habit").click();
    await f.browser.waitUntil(async () => {
      const alerts = await f.browser.$$('[role="alert"]');
      for (const alert of alerts)
        if (/provider|unsupported|unavailable/i.test(await alert.getText()))
          return true;
      return false;
    });
    assert.equal(await taskCall(f.browser, "providerCallbacks"), 0);
    assert.equal(text(path), raw);
    assert.equal(text(daily), initialDaily);
    const before = (await taskRecords(f.browser, "submit")).length;
    assert.ok(
      (await taskRecords(f.browser, "submit")).every(
        (record) => record.native?.kind !== "operation",
      ),
    );
    await taskCall(f.browser, "customProvider", false);
    await configured(f.browser);
    await complete(f.browser, "A tracked habit").click();
    const operation = await completedSubmit(f.browser);
    assert.equal(text(path), operation.task_replacement);
    assert.equal(text(daily), operation.daily_replacement);
    assert.match(text(daily), /- \[x\] \[A tracked habit\]/);
    assert.equal(await taskCall(f.browser, "providerCallbacks"), 0);
    await noReplay(f.browser, before + 1);
    await f.session.close();
  } finally {
    if (f.session.isRunning())
      await taskCall(f.browser, "customProvider", false);
  }
});

test("installed Tasks refuses stale admission visibly without changing external bytes or replaying", async (context) => {
  const f = await taskFixture(context, "tasks-installed-stale");
  const path = join(f.vault, "Hosted.md");
  const external = hostedTask + "\nExternal content must survive.\n";
  try {
    await planner(f.browser);
    await taskCall(f.browser, "holdNextSubmit");
    await complete(f.browser).click();
    await f.browser.waitUntil(
      async () => (await taskCall(f.browser, "snapshot")).held === "submit",
    );
    writeFileSync(path, external);
    await taskCall(f.browser, "release");
    let refusal;
    await f.browser.waitUntil(async () => {
      refusal = (await taskRecords(f.browser, "submit"))[0]?.native;
      return refusal?.kind === "failure";
    });
    assert.equal(refusal.failure.code, "CONFLICT");
    assert.equal(refusal.failure.uncertain, false);
    await f.browser.waitUntil(async () => {
      const alerts = await f.browser.$$('[role="alert"]');
      for (const alert of alerts)
        if (/version|changed|conflict/i.test(await alert.getText()))
          return true;
      return false;
    });
    assert.equal(text(path), external);
    await noReplay(f.browser, 1);
    await f.session.close();
  } finally {
    if (f.session.isRunning()) await taskCall(f.browser, "release");
  }
});

test("installed Tasks retains one accepted lost reply and cold read-only journal inspection without replay", async (context) => {
  const f = await taskFixture(context, "tasks-installed-recovery");
  const path = join(f.vault, "Hosted.md");
  await planner(f.browser);
  await taskCall(f.browser, "loseNextSubmitReply");
  await complete(f.browser).click();
  const operation = await completedSubmit(f.browser);
  await f.browser.waitUntil(async () => {
    const alerts = await f.browser.$$('[role="alert"]');
    for (const alert of alerts)
      if (/unknown|inspect/i.test(await alert.getText())) return true;
    return false;
  });
  assert.equal(text(path), operation.task_replacement);
  assert.match(text(path), /status: completed/);
  const requestId = operation.request.request_id;
  const references = await taskCall(f.browser, "references");
  assert.equal(references.length, 1);
  assert.equal(references[0].requestId, requestId);
  assert.equal(references[0].path, "Hosted.md");
  assert.equal(references[0].action, "complete");
  for (const key of [
    "original",
    "task_replacement",
    "daily_replacement",
    "draft",
  ])
    assert.equal(Object.hasOwn(references[0], key), false);
  assert.ok((await taskRecords(f.browser, "submit"))[0].lostReply);
  await inspectInterrupted(f.browser, requestId);
  await noReplay(f.browser, 1);
  await f.session.close();
  const cold = await coldTasks(
    context,
    f.root,
    "tasks-installed-recovery-cold",
  );
  await inspectInterrupted(cold.browser, requestId);
  await planner(cold.browser, "Logbook");
  await visibleText(cold.browser, title);
  assert.equal(
    (await taskRecords(cold.browser, "inspect")).filter(
      (record) => record.command.request_id === requestId,
    ).length,
    1,
  );
  await noReplay(cold.browser, 0);
  assert.equal(text(path), operation.task_replacement);
  await cold.close();
});
