import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
import {
  providerDriver,
  assertDefaults,
} from "./native-queue-provider/driver.mjs";

const settings = {
  skip: process.env.LAPIS_AI_TEST_CORE_QUEUE_PROVIDER !== "1",
  timeout: 300000,
};

test(
  "installed provider queue Stop preserves exact Unknown, cancellation and cold no-replay",
  settings,
  async (context) => {
    const driver = providerDriver(context, "native-stop");
    const first = `STOP-${driver.witness}`;
    const pending = `PENDING-${driver.witness}`;
    const cancelled = `CANCELLED-${driver.witness}`;
    try {
      await driver.launch("queue-provider-stop");
      await driver.openChat();
      await driver.send(
        `Return ${first} once on each of 48 lines. Do not inspect files or use tools.`,
      );
      const head = (await driver.audit()).submitted[0];
      assertDefaults(head);
      await driver.session.browser.waitUntil(
        () => {
          const record = driver.readTurn(head);
          return record.phase === "running" && record.output.length > 0;
        },
        { timeout: 60000, interval: 100 },
      );
      await driver.send(
        `Return exactly the string ${pending}. Do not inspect files or use tools.`,
      );
      await driver.send(
        `Return exactly the string ${cancelled}. Do not inspect files or use tools.`,
      );
      await driver.cancel(cancelled);
      await driver.control("Pause queue", "stop");
      const stopped = await driver.terminal(head);
      assert.equal(stopped.phase, "unknown");
      assert.equal(stopped.failure_code, "vault_closed_during_turn");
      const before = (
        await driver.queue({
          kind: "read",
          conversation_id: head.conversation_id,
        })
      ).queue;
      assert.equal(before.paused, true);
      assert.equal(before.barrier, "explicit_stop");
      assert.deepEqual(
        before.entries.map((entry) => entry.phase),
        ["pending", "cancelled"],
      );
      const files = driver.turnFiles(head);
      assert.equal(
        files.length,
        1,
        "Neither unstarted entry may reach a provider",
      );
      const transcriptHash = driver.digest(driver.transcript(head));
      driver.save("stopped-native-unknown-no-resume", {
        stopped,
        queue: before,
        files,
        transcriptHash,
      });
      await driver.close();
      await driver.launch("queue-provider-stop-cold", true);
      await driver.recover(first);
      const after = (
        await driver.queue({
          kind: "read",
          conversation_id: head.conversation_id,
        })
      ).queue;
      assert.equal(after.paused, true);
      assert.equal(after.barrier, "service_restarted");
      assert.deepEqual(after.entries, before.entries);
      assert.deepEqual(driver.readTurn(head), stopped);
      assert.deepEqual(driver.turnFiles(head), files);
      assert.equal(driver.digest(driver.transcript(head)), transcriptHash);
      await delay(1000);
      const audit = await driver.audit();
      assert.equal(audit.submitted.length, 0);
      assert.equal(audit.accepted.length, 0);
      assert.equal(
        audit.resumed.length,
        0,
        "Never resume an Unknown provider outcome",
      );
      driver.unchangedNote();
      driver.save("cold-unknown-retained-without-replay", {
        queue: after,
        files: driver.turnFiles(head),
        transcriptHash,
      });
      await driver.close();
      console.log(`Native provider Stop receipt: ${driver.root}`);
    } catch (error) {
      driver.save("failed", {
        error: String(error.stack ?? error),
        ui: await driver.session.browser
          .execute(() => document.body.innerText)
          .catch(String),
        audit: await driver.audit().catch(String),
      });
      throw error;
    } finally {
      await driver.cleanup();
    }
  },
);

test(
  "installed provider queue completes without observers and resumes labelled offline retained work exactly once",
  settings,
  async (context) => {
    const driver = providerDriver(context, "native-completion-and-resume");
    const first = `HEAD-${driver.witness}`;
    const live = `LIVE-${driver.witness}`;
    const resumed = `RESUMED-${driver.witness}`;
    try {
      await driver.launch("queue-provider-completion");
      await driver.openChat();
      await driver.send(
        `Return ${first} once on each of 48 lines. Do not inspect files or use tools.`,
      );
      const head = (await driver.audit()).submitted[0];
      assertDefaults(head);
      await driver.send(
        `Return exactly the string ${live}. Do not inspect files or use tools.`,
      );
      const accepted = (await driver.audit()).accepted[0];
      const entry = accepted.entries[0];
      assert.equal(
        entry.input.capture.selection.targets[0].executionMode,
        "read-only",
      );
      assert.equal(entry.input.capture.selection.targets[0].model, undefined);
      assert.equal(
        entry.input.capture.selection.targets[0].thinking,
        undefined,
      );
      const detached = await driver.holdReload();
      assert.ok(
        ["accepted", "running"].includes(driver.readTurn(head).phase),
        "Detach must precede provider completion",
      );
      const finishedHead = await driver.terminal(head);
      const lookup = {
        ...head,
        input: { ...head.input, request_id: entry.request_id },
      };
      const finished = await driver.terminal(lookup);
      assert.equal(finishedHead.phase, "completed");
      assert.equal(finished.phase, "completed");
      assert.equal(finished.output.trim(), live);
      assertDefaults(finished);
      const audit = await driver.audit();
      assert.equal(
        audit.calls.filter(
          (call) =>
            ["desktop_ai_turn", "desktop_ai_queue"].includes(call.command) &&
            call.at >= detached.heldAt,
        ).length,
        0,
      );
      assert.equal(driver.turnFiles(head).length, 2);
      driver.save("real-head-and-queued-nonce-completed-without-observer", {
        finishedHead,
        finished,
        capture: entry.input.capture,
        audit,
      });
      await driver.releaseReload();
      await driver.recover(first, live);
      await driver.queue({
        kind: "stop",
        conversation_id: head.conversation_id,
      });
      assert.equal(driver.readQueue(head).paused, true);
      const beforeFiles = driver.turnFiles(head);
      const beforeTranscript = driver.digest(driver.transcript(head));
      await driver.close();
      const fixture = driver.seedOffline(
        finished,
        `Return exactly the string ${resumed}. Do not inspect files or use tools.`,
      );
      await driver.launch("queue-provider-known-head-cold", true);
      await driver.recover(first, live);
      assert.deepEqual(driver.readQueue(head), {
        ...fixture.seeded,
        barrier: "service_restarted",
      });
      assert.deepEqual(driver.turnFiles(head), beforeFiles);
      assert.equal(driver.digest(driver.transcript(head)), beforeTranscript);
      assert.equal((await driver.audit()).resumed.length, 0);
      await driver.control("Resume queue", "resume");
      const finalLookup = {
        ...head,
        input: { ...head.input, request_id: fixture.entry.request_id },
      };
      const final = await driver.terminal(finalLookup);
      assert.equal(final.phase, "completed");
      assert.equal(final.output.trim(), resumed);
      assertDefaults(final);
      const resumeAudit = await driver.audit();
      assert.equal(resumeAudit.resumed.length, 1);
      assert.equal(
        resumeAudit.resumed[0].after_request_id,
        finished.input.request_id,
      );
      assert.equal(driver.turnFiles(head).length, 3);
      const transcript = readFileSync(driver.transcript(head), "utf8")
        .trim()
        .split("\n")
        .map(JSON.parse);
      assert.equal(
        transcript.filter(
          (event) => event.id === fixture.entry.input.capture.user.id,
        ).length,
        1,
      );
      assert.equal(
        transcript.filter(
          (event) =>
            event.type === "queue.outcome" &&
            event.parentId === fixture.entry.input.capture.user.id,
        ).length,
        1,
      );
      const finalFiles = driver.turnFiles(head);
      const finalTranscript = driver.digest(driver.transcript(head));
      driver.save("explicit-ui-resume-completed-once", {
        final,
        queue: driver.readQueue(head),
        files: finalFiles,
        transcriptHash: finalTranscript,
        audit: resumeAudit,
      });
      await driver.close();
      await driver.launch("queue-provider-final-cold", true);
      await driver.recover(first, resumed);
      await delay(1000);
      assert.deepEqual(driver.readTurn(finalLookup), final);
      assert.deepEqual(driver.turnFiles(head), finalFiles);
      assert.equal(driver.digest(driver.transcript(head)), finalTranscript);
      const cold = await driver.audit();
      assert.equal(
        cold.submitted.length + cold.accepted.length + cold.resumed.length,
        0,
      );
      driver.unchangedNote();
      driver.save("cold-complete-retained-without-replay", {
        files: finalFiles,
        transcriptHash: finalTranscript,
        audit: cold,
      });
      await driver.close();
      console.log(`Native provider completion/resume receipt: ${driver.root}`);
    } catch (error) {
      driver.save("failed", {
        error: String(error.stack ?? error),
        ui: await driver.session.browser
          .execute(() => document.body.innerText)
          .catch(String),
        audit: await driver.audit().catch(String),
      });
      throw error;
    } finally {
      await driver.cleanup();
    }
  },
);
