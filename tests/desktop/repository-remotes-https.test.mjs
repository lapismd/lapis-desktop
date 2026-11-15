import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { nativeSession } from "./native-session.mjs";
import {
  jj,
  success,
  select,
  admit,
  history,
  ready,
} from "./repository-driver.mjs";
import { repositoryHttpFixture } from "./repository-http-fixture.mjs";

test(
  "cold Desktop publishes one reviewed original through real HTTPS and OS custody",
  { timeout: 240000 },
  async (context) => {
    assert.equal(
      process.env.LAPIS_DESKTOP_REMOTES_HTTPS,
      "1",
      "Explicit disposable HTTPS acceptance opt-in required",
    );
    assert.equal(process.platform, "darwin");
    assert.equal(process.arch, "arm64");
    const root = mkdtempSync(join(tmpdir(), "lapis-desktop-remotes-https-"));
    const vault = join(root, "Vault");
    mkdirSync(vault);
    jj(vault, ["git", "init", "--no-colocate", "."]);
    writeFileSync(join(vault, "Note.md"), "Reviewed original publication\n");
    jj(vault, ["commit", "-m", "Reviewed original publication"]);
    jj(vault, ["bookmark", "create", "publish", "-r", "@-"]);
    jj(vault, ["bookmark", "create", "never-publish", "-r", "@-"]);
    const commit = jj(vault, [
      "log",
      "-r",
      "publish",
      "--no-graph",
      "-T",
      "commit_id",
    ]).trim();
    writeFileSync(join(vault, "Uncaptured.md"), "Keep unsnapshotted bytes\n");
    const checkout = readFileSync(join(vault, ".jj/working_copy/checkout"));
    const tree = readFileSync(join(vault, ".jj/working_copy/tree_state"));
    const token = crypto.randomUUID() + crypto.randomUUID();
    const endpoint = await repositoryHttpFixture(root, token);
    context.after(endpoint.close);
    const session = await nativeSession(
      "repository-remotes-https",
      root,
      undefined,
      [],
      { background: true },
    );
    context.after(session.cleanup);
    const selected = await select(session, root, vault);
    await admit(session, selected.sessionId);
    const heads = await history(session, "heads", {
      vault: selected.sessionId,
    });
    const handle = await history(session, "open", {
      vault: selected.sessionId,
      operation: heads.heads[0],
    });
    const pinned = await ready(session, selected.sessionId, handle);
    const target = (snapshot, name = "original") =>
      snapshot.settings.targets.find((item) => item.target === name);
    const read = () =>
      success(session, "desktop_repository_remotes", {
        request: { sessionId: selected.sessionId },
      });
    let snapshot = await read();
    const control = async (command) => {
      snapshot = await success(session, "desktop_repository_remotes", {
        request: {
          sessionId: selected.sessionId,
          command: { ...command, expectedRevision: snapshot.revision },
        },
      });
      assert.ok(
        !JSON.stringify(snapshot).includes(token),
        "Stored token cannot return to the renderer",
      );
      return snapshot;
    };
    const label = `native-https-${crypto.randomUUID()}`;
    try {
      assert.equal(snapshot.settings.storage, "available");
      await control({
        kind: "save_credential",
        input: {
          label,
          host: new URL(endpoint.endpoint).host,
          username: "fixture-user",
          token,
          provider: "https",
        },
      });
      const credential = snapshot.settings.credentials.find(
        (item) => item.label === label,
      );
      assert.ok(credential?.available);
      await control({
        kind: "save_connection",
        target: "original",
        connection: {
          name: "native-https-fixture",
          url: `${endpoint.endpoint}/token.git`,
          branch: "reviewed-only",
          bookmark: "publish",
          authentication: "token",
          credential: credential.id,
        },
      });
      assert.equal(snapshot.settings.automaticSync, false);
      assert.equal(target(snapshot, "backup").connection, null);
      assert.equal(endpoint.facts.receives, 0);
      await control({ kind: "test_connection", target: "original" });
      assert.equal(endpoint.facts.receives, 0);
      const review = target(
        await control({ kind: "review_push", target: "original" }),
      ).review;
      assert.equal(review.commit, commit);
      try {
        await control({
          kind: "push",
          target: "original",
          reviewId: review.id,
        });
      } catch (error) {
        snapshot = await read();
        const pending = target(snapshot).publication;
        if (!pending) throw error;
        assert.equal(endpoint.refs(), `refs/heads/reviewed-only ${commit}`);
        await control({
          kind: "observe_push",
          target: "original",
          requestId: pending.id,
        });
      }
      assert.equal(endpoint.refs(), `refs/heads/reviewed-only ${commit}`);
      assert.equal(endpoint.facts.receives, 1, "Publication is never replayed");
      await control({ kind: "fetch", target: "original" });
      assert.ok(endpoint.facts.authenticatedReads > 0);
      await control({
        kind: "save_connection",
        target: "backup",
        connection: {
          name: "anonymous-fixture",
          url: `${endpoint.endpoint}/anonymous.git`,
          branch: "backup",
          bookmark: "lapis-backup",
          authentication: "anonymous",
          credential: "",
        },
      });
      await control({ kind: "test_connection", target: "backup" });
      assert.ok(endpoint.facts.anonymousReads > 0);
      assert.equal(
        endpoint.facts.leaked,
        0,
        "Anonymous target must not receive the original credential",
      );
      assert.equal(endpoint.facts.receives, 1);
      assert.equal(snapshot.settings.automaticSync, false);
      assert.equal(
        readFileSync(join(vault, "Note.md"), "utf8"),
        "Reviewed original publication\n",
      );
      assert.equal(
        readFileSync(join(vault, "Uncaptured.md"), "utf8"),
        "Keep unsnapshotted bytes\n",
      );
      assert.deepEqual(
        readFileSync(join(vault, ".jj/working_copy/checkout")),
        checkout,
      );
      assert.deepEqual(
        readFileSync(join(vault, ".jj/working_copy/tree_state")),
        tree,
      );
      assert.equal(
        (await ready(session, selected.sessionId, handle)).operation,
        pinned.operation,
      );
      await control({ kind: "forget_credential", id: credential.id });
      console.log(
        "Real native HTTPS endpoint facts:",
        JSON.stringify(endpoint.facts),
      );
    } finally {
      if (session.isRunning()) {
        snapshot = await read();
        for (const credential of snapshot.settings.credentials.filter(
          (item) => item.label === label,
        ))
          await control({ kind: "forget_credential", id: credential.id });
        await success(session, "vault_close", {
          sessionId: selected.sessionId,
        });
        await session.close(true);
      }
    }
  },
);
