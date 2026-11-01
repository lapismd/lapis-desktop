import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { nativeTurnFixture } from "./native-turn-fixture.mjs";

export function nativeQueueFixture() {
  const fixture = nativeTurnFixture();
  const release = join(fixture.root, "release");
  const helper = join(fixture.root, "helpers/lapis-acp");
  const digest = (body) => createHash("sha256").update(body).digest("hex");
  const oldHash = digest(readFileSync(helper));
  const peer = readFileSync(
    resolve(
      "../lapis-server/crates/lapis-app-core/tests/support/native_queue/peer.py",
    ),
    "utf8",
  )
    .replaceAll("os.environ['LOG']", JSON.stringify(fixture.log))
    .replaceAll("os.environ['RELEASE']", JSON.stringify(release));
  writeFileSync(helper, peer, { mode: 0o700 });
  const manifest = join(fixture.root, "helpers/runtime-manifest.toml");
  writeFileSync(
    manifest,
    readFileSync(manifest, "utf8").replace(oldHash, digest(peer)),
  );
  return {
    ...fixture,
    release: () => writeFileSync(release, "ready"),
    releaseQueued: () => writeFileSync(`${release}.queued`, "ready"),
    commands: () =>
      existsSync(fixture.log)
        ? readFileSync(fixture.log, "utf8")
            .trim()
            .split("\n")
            .filter(Boolean)
            .map(JSON.parse)
        : [],
  };
}
export function queueEnvironment(context) {
  const values = {
    LAPIS_DESKTOP_AI_OWNER: "core",
    LAPIS_DESKTOP_ACCEPTANCE_NATIVE_AI: "1",
  };
  const previous = Object.fromEntries(
    Object.keys(values).map((key) => [key, process.env[key]]),
  );
  Object.assign(process.env, values);
  context.after(() => {
    for (const [key, value] of Object.entries(previous))
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
  });
}
export async function nativeQueueInvoke(session, command, args = {}) {
  return session.browser.execute(
    async (command, args) => {
      try {
        return { value: await globalThis.__TAURI__.core.invoke(command, args) };
      } catch (error) {
        return {
          failure: {
            code: error?.code,
            message: String(error?.message ?? error),
          },
        };
      }
    },
    command,
    args,
  );
}
export async function nativeQueueSuccess(session, command, args = {}) {
  const value = await nativeQueueInvoke(session, command, args);
  assert.equal(value.failure, undefined, JSON.stringify(value));
  return value.value;
}
export function queueInput(head, name) {
  return {
    acceptance_id: randomUUID(),
    conversation_id: head.conversation_id,
    after_request_id: head.input.request_id,
    scope_dir: head.input.scope_dir,
    target_id: head.input.target_id,
    capture: {
      version: 1,
      id: randomUUID(),
      state: "queued",
      user: {
        schemaVersion: 3,
        id: `queued-user-${randomUUID()}`,
        type: "message",
        role: "user",
        text: `Exact ${name} café 📝`,
        createdAt: "2026-10-27T12:00:00.000Z",
        recipients: [
          { id: "codex", label: "Codex", token: "jj-store-agent:636f646578;" },
        ],
        provenance: { originClass: "owner", sourceKind: "user-message" },
      },
      selection: {
        targets: [{ id: "codex", agent: "codex", executionMode: "read-only" }],
        runtime: "acp",
        attachments: [],
      },
    },
  };
}
