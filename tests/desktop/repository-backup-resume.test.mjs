import { test } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { nativeSession } from "./native-session.mjs";

test(
  "failed final capture resumes automatic watching for later saved files",
  { timeout: 90000 },
  async (context) => {
    const parent = resolve(
      process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT ?? ".local/native-test",
    );
    mkdirSync(parent, { recursive: true });
    const root = mkdtempSync(join(parent, "backup-resume-"));
    const vault = join(root, "Resume vault");
    mkdirSync(vault);
    const file = join(vault, "Protected.md");
    writeFileSync(file, "original retained file\n");
    const session = await nativeSession("backup-resume", root, undefined, [], {
      background: true,
    });
    context.after(session.cleanup);
    context.after(() => chmodSync(file, 0o644));
    const browser = session.browser;
    writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
    const selected = await browser.execute(() =>
      globalThis.__TAURI__.core.invoke("vault_select"),
    );
    const request = { sessionId: selected.sessionId };
    const initial = (
      await browser.execute(async (request) => {
        const channel = new globalThis.__TAURI__.core.Channel();
        globalThis.__resumeStatuses = [];
        channel.onmessage = (value) => globalThis.__resumeStatuses.push(value);
        globalThis.__resumeChannel = channel;
        return {
          snapshot: await globalThis.__TAURI__.core.invoke(
            "desktop_backup_start",
            { request, onChange: channel },
          ),
        };
      }, request)
    ).snapshot;
    assert.equal(initial.phase, "ready");
    writeFileSync(file, "repaired retained file\n");
    chmodSync(file, 0o000);
    const result = await browser.execute(
      async (request) =>
        globalThis.__TAURI__.core
          .invoke("desktop_backup_stop", { request })
          .then(
            () => ({ ok: true }),
            () => ({ ok: false }),
          ),
      request,
    );
    assert.equal(result.ok, false);
    chmodSync(file, 0o644);
    async function savedAfter(previous) {
      let latest;
      await browser.waitUntil(
        async () => {
          latest = (
            await browser.execute(() => ({
              snapshot: globalThis.__resumeStatuses.at(-1),
            }))
          ).snapshot;
          return (
            latest?.phase === "ready" &&
            latest.checkpoint?.commit !== previous.commit
          );
        },
        {
          timeout: 30000,
          timeoutMsg:
            "A cancelled close must preserve automatic capture of later saved files",
        },
      );
      return latest.checkpoint;
    }
    const repaired = await savedAfter(initial.checkpoint);
    writeFileSync(join(vault, "Later.md"), "saved after close was cancelled\n");
    const later = await savedAfter(repaired);
    assert.notEqual(later.commit, repaired.commit);
    let complete = false;
    for (let batch = 0; batch < 20; batch++) {
      const progress = await browser.execute(
        (request) =>
          globalThis.__TAURI__.core.invoke("desktop_backup_history_search", {
            request: { ...request, action: { kind: "step" } },
          }),
        request,
      );
      if (progress.complete) {
        complete = true;
        break;
      }
    }
    assert.equal(complete, true);
    const retained = await browser.execute(
      (request) =>
        globalThis.__TAURI__.core.invoke("desktop_backup_history_search", {
          request: {
            ...request,
            action: {
              kind: "query",
              search: {
                expression: {
                  type: "term",
                  field: "content",
                  value: "saved after close was cancelled",
                },
                case_sensitive: false,
                cursor: null,
                limit: 100,
              },
            },
          },
        }),
      request,
    );
    assert.equal(retained.hits.length, 1);
    assert.equal(
      retained.hits[0].record.revision.checkpoint.commit,
      later.commit,
    );
    await browser.execute(
      (request) =>
        globalThis.__TAURI__.core.invoke("desktop_backup_stop", { request }),
      request,
    );
    await session.close();
  },
);
