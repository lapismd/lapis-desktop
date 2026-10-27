import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { renameSync } from "node:fs";
import { nativeSession } from "./native-session.mjs";
import {
  nativeQueueFixture,
  queueEnvironment,
  nativeQueueInvoke as invoke,
  nativeQueueSuccess as success,
} from "./native-queue-fixture.mjs";

test(
  "native queue requires the current local physical-vault admission and refuses browser authority",
  { timeout: 90000 },
  async (context) => {
    queueEnvironment(context);
    const fixture = nativeQueueFixture();
    const session = await nativeSession(
      "native-queue-admission",
      fixture.root,
      undefined,
      [],
      { background: true },
    );
    context.after(session.cleanup);
    const command = { kind: "read", conversation_id: randomUUID() };
    assert.ok(
      (
        await invoke(session, "desktop_ai_queue", {
          request: { sessionId: "unadmitted", command },
        })
      ).failure,
    );
    const descriptor = await success(session, "vault_select");
    await success(session, "desktop_ai_admit", {
      request: { sessionId: descriptor.sessionId },
    });
    const request = { sessionId: descriptor.sessionId, command };
    assert.deepEqual(await success(session, "desktop_ai_queue", { request }), {
      kind: "queue",
      queue: null,
    });
    for (const key of [
      "window",
      "root",
      "generation",
      "credentials",
      "executable",
    ])
      assert.ok(
        (
          await invoke(session, "desktop_ai_queue", {
            request: { ...request, [key]: "browser-authority" },
          })
        ).failure,
        key,
      );
    assert.ok(
      (
        await invoke(session, "desktop_ai_queue", {
          request: { ...request, sessionId: "foreign-vault" },
        })
      ).failure,
    );
    assert.ok(
      (
        await invoke(session, "desktop_ai_queue", {
          request: { ...request, command: { ...command, root: "/other" } },
        })
      ).failure,
    );
    const moved = `${fixture.vault}-moved`;
    renameSync(fixture.vault, moved);
    try {
      assert.ok(
        (await invoke(session, "desktop_ai_queue", { request })).failure,
        "Physical-root replacement must fail closed",
      );
    } finally {
      renameSync(moved, fixture.vault);
    }
    await success(session, "desktop_ai_release", { request: { reload: true } });
    assert.ok(
      (await invoke(session, "desktop_ai_queue", { request })).failure,
      "Detached renderer cannot use the retained owner",
    );
    await success(session, "desktop_ai_admit", {
      request: { sessionId: descriptor.sessionId },
    });
    assert.deepEqual(await success(session, "desktop_ai_queue", { request }), {
      kind: "queue",
      queue: null,
    });
    await success(session, "desktop_ai_release", {
      request: { reload: false },
    });
    assert.ok((await invoke(session, "desktop_ai_queue", { request })).failure);
    await success(session, "vault_close", { sessionId: descriptor.sessionId });
    await session.close(true);
  },
);
