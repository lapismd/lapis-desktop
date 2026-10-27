import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { nativeSession } from "./native-session.mjs";
import {
  nativeQueueFixture,
  queueEnvironment,
  queueInput,
  nativeQueueInvoke as invoke,
  nativeQueueSuccess as success,
} from "./native-queue-fixture.mjs";

test(
  "native queue preserves exact admitted capture, Stop/cancel/resume and cold paused recovery without replay",
  { timeout: 180000 },
  async (context) => {
    queueEnvironment(context);
    const fixture = nativeQueueFixture();
    async function launch(name) {
      writeFileSync(
        `${fixture.root}/picker.json`,
        JSON.stringify(fixture.vault),
      );
      const session = await nativeSession(name, fixture.root, undefined, [], {
        background: true,
      });
      context.after(session.cleanup);
      const descriptor = await success(session, "vault_select");
      await success(session, "desktop_ai_admit", {
        request: { sessionId: descriptor.sessionId },
      });
      return { session, descriptor };
    }
    const first = await launch("native-queue-owner");
    const turn = (command) =>
      success(first.session, "desktop_ai_turn", {
        request: { sessionId: first.descriptor.sessionId, command },
      });
    const queue = (command) =>
      success(first.session, "desktop_ai_queue", {
        request: { sessionId: first.descriptor.sessionId, command },
      });
    const targets = await turn({ kind: "targets" });
    assert.equal(
      targets.targets[0].queue_selection.recipient.token,
      "jj-store-agent:636f646578;",
    );
    assert.equal(targets.targets[0].queue_selection.target.agent, "codex");
    assert.equal(targets.targets[0].default_mode, "read-only");
    const initial = {
      request_id: randomUUID(),
      target_id: targets.targets[0].id,
      scope_dir: "",
      prompt: "held-first",
      context: null,
      options: {
        mode: "read-only",
        model: null,
        effort: null,
        max_duration_ms: 60000,
      },
    };
    const head = (await turn({ kind: "submit", input: initial })).record;
    await first.session.browser.waitUntil(
      async () => fixture.commands().some((frame) => frame.type === "prompt"),
      { timeout: 30000 },
    );
    const kept = queueInput(head, "retained");
    const removed = queueInput(head, "cancelled");
    const refused = await invoke(first.session, "desktop_ai_queue", {
      request: {
        sessionId: first.descriptor.sessionId,
        command: { kind: "accept", input: { ...kept, capture: null } },
      },
    });
    assert.equal(
      refused.failure?.code,
      "EINVAL",
      "Core refusal must preserve its typed native code",
    );
    assert.equal(
      (await queue({ kind: "read", conversation_id: head.conversation_id }))
        .queue,
      null,
    );
    await first.session.browser.execute(() => {
      const original = globalThis.fetch.bind(globalThis);
      globalThis.__queueLostReply = 0;
      globalThis.fetch = async (resource, options) => {
        const url = new URL(
          typeof resource === "string" ? resource : resource.url,
          location.href,
        );
        const args =
          typeof options?.body === "string" ? JSON.parse(options.body) : {};
        const response = await original(resource, options);
        if (
          (url.protocol === "ipc:" || url.hostname === "ipc.localhost") &&
          decodeURIComponent(url.pathname.slice(1)) === "desktop_ai_queue" &&
          args.request?.command?.kind === "accept"
        ) {
          globalThis.fetch = original;
          globalThis.__queueLostReply++;
          await response.arrayBuffer();
          return new Response(
            JSON.stringify({
              code: "EIO",
              message: "Queue acknowledgement lost after native acceptance",
            }),
            {
              headers: {
                "Content-Type": "application/json",
                "Tauri-Response": "error",
              },
            },
          );
        }
        return response;
      };
    });
    assert.ok(
      (
        await invoke(first.session, "desktop_ai_queue", {
          request: {
            sessionId: first.descriptor.sessionId,
            command: { kind: "accept", input: kept },
          },
        })
      ).failure,
    );
    const accepted = (
      await queue({ kind: "read", conversation_id: head.conversation_id })
    ).queue;
    assert.equal(
      await first.session.browser.execute(() => globalThis.__queueLostReply),
      1,
    );
    assert.equal(
      accepted.entries.length,
      1,
      "Lost acknowledgement is observed without replaying accept",
    );
    assert.deepEqual(accepted.entries[0].input, kept);
    assert.notEqual(accepted.entries[0].request_id, kept.acceptance_id);
    assert.notEqual(accepted.entries[0].request_id, kept.capture.user.id);
    assert.notEqual(kept.capture.id, kept.capture.user.id);
    await queue({ kind: "accept", input: removed });
    const cancelled = (
      await queue({
        kind: "cancel",
        conversation_id: head.conversation_id,
        acceptance_id: removed.acceptance_id,
      })
    ).queue;
    assert.equal(cancelled.entries[1].phase, "cancelled");
    assert.equal(
      (await queue({ kind: "stop", conversation_id: head.conversation_id }))
        .queue.paused,
      true,
    );
    fixture.release();
    await first.session.browser.waitUntil(
      async () =>
        !["accepted", "running"].includes(
          (await turn({ kind: "read", request_id: initial.request_id })).record
            .phase,
        ),
      { timeout: 30000 },
    );
    assert.equal(
      fixture.commands().filter((frame) => frame.type === "prompt").length,
      1,
    );
    const paused = (
      await queue({ kind: "read", conversation_id: head.conversation_id })
    ).queue;
    assert.equal(paused.entries[0].phase, "pending");
    await success(first.session, "desktop_ai_release", {
      request: { reload: true },
    });
    assert.ok(
      (
        await invoke(first.session, "desktop_ai_queue", {
          request: {
            sessionId: first.descriptor.sessionId,
            command: { kind: "read", conversation_id: head.conversation_id },
          },
        })
      ).failure,
    );
    await first.session.close(true);
    const cold = await launch("native-queue-cold");
    const coldQueue = (command) =>
      success(cold.session, "desktop_ai_queue", {
        request: { sessionId: cold.descriptor.sessionId, command },
      });
    const observed = (
      await coldQueue({ kind: "read", conversation_id: head.conversation_id })
    ).queue;
    assert.equal(observed.paused, true);
    assert.deepEqual(
      observed.entries.map((entry) => entry.input),
      [kept, removed],
    );
    assert.equal(
      fixture.commands().filter((frame) => frame.type === "prompt").length,
      1,
    );
    await coldQueue({
      kind: "resume",
      conversation_id: head.conversation_id,
      after_request_id: observed.head_request_id,
    });
    let finished;
    await cold.session.browser.waitUntil(
      async () => {
        finished = (
          await coldQueue({
            kind: "read",
            conversation_id: head.conversation_id,
          })
        ).queue;
        return (
          finished.entries[0].phase === "completed" &&
          finished.entries[0].receipt_published
        );
      },
      { timeout: 30000 },
    );
    assert.equal(finished.entries[1].phase, "cancelled");
    assert.equal(
      fixture.commands().filter((frame) => frame.type === "prompt").length,
      2,
    );
    const transcript = readFileSync(
      `${fixture.vault}/.lapis/agents/sessions/${head.conversation_id}/transcript.jsonl`,
      "utf8",
    )
      .trim()
      .split("\n")
      .map(JSON.parse);
    assert.deepEqual(
      transcript.find((entry) => entry.id === kept.capture.user.id),
      kept.capture.user,
    );
    assert.equal(
      transcript.filter(
        (entry) => entry.role === "user" && entry.id === kept.capture.user.id,
      ).length,
      1,
    );
    assert.equal(
      transcript.filter(
        (entry) =>
          entry.type === "queue.outcome" &&
          entry.parentId === kept.capture.user.id,
      ).length,
      1,
    );
    assert.equal(
      (await success(cold.session, "shell_info")).nativeVisibility.Ok[0],
      false,
    );
    await cold.session.close(true);
    console.log(`Native queue cold recovery evidence: ${fixture.root}`);
  },
);
