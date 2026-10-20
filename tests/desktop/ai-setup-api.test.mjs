import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { randomUUID } from "node:crypto";
import { nativeSession } from "./native-session.mjs";
process.env.LAPIS_DESKTOP_ACCEPTANCE_NATIVE_AI = "1";
// Dispatch exactly once, then observe its completion without blocking a 10s
// WebDriver command while the complete native helper bundle is verified.
async function invoke(session, command, args = {}) {
  const key = randomUUID();
  await session.browser.execute(
    (key, command, args) => {
      const results = (globalThis.__setupResults ??= Object.create(null));
      globalThis.__TAURI__.core.invoke(command, args).then(
        (value) => {
          results[key] = { value, failure: null };
        },
        (error) => {
          results[key] = {
            value: null,
            failure: String(error?.message ?? error),
          };
        },
      );
    },
    key,
    command,
    args,
  );
  // A second IPC call must stay responsive while native preparation is pending.
  const responsive = await session.browser.execute(() =>
    globalThis.__TAURI__.core.invoke("shell_info"),
  );
  assert.equal(responsive.backgroundApi, true);
  await session.browser.waitUntil(
    () =>
      session.browser.execute(
        (key) => Object.hasOwn(globalThis.__setupResults, key),
        key,
      ),
    { timeout: 120000, interval: 100, timeoutMsg: `${command} did not settle` },
  );
  return session.browser.execute((key) => {
    const results = globalThis.__setupResults;
    const value = results[key];
    delete results[key];
    return value;
  }, key);
}
async function success(session, command, args = {}) {
  const reply = await invoke(session, command, args);
  assert.equal(reply.failure, null, `${command}: ${reply.failure}`);
  return reply.value;
}
async function select(session, root, vault) {
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  const descriptor = await success(session, "vault_select");
  await success(session, "desktop_ai_admit", {
    request: { sessionId: descriptor.sessionId },
  });
  return descriptor.sessionId;
}
const provider = (session, id, action) =>
  success(session, "desktop_ai_providers", {
    request: { sessionId: id, action },
  });
const compute = (session, id, action) =>
  success(session, "desktop_ai_compute", {
    request: { sessionId: id, action },
  });
test("cold hidden WebView admits write-only provider settings and inert conditional compute configuration", async (context) => {
  const parent = resolve(".local/native-test");
  mkdirSync(parent, { recursive: true });
  const root = mkdtempSync(join(parent, "ai-setup-api-"));
  const vault = join(root, "Vault");
  mkdirSync(vault);
  mkdirSync(join(root, "profile"));
  writeFileSync(
    join(root, "profile/ai-runtime.json"),
    JSON.stringify({
      version: 1,
      bundle: resolve("src-tauri/resources/lapis-ai"),
      path: ["/usr/bin", "/bin"],
    }),
  );
  let active = await nativeSession("ai-setup-api", root, undefined, [], {
    background: true,
  });
  context.after(async () => {
    await active.cleanup();
  });
  const id = await select(active, root, vault);
  const settings = await provider(active, id, { type: "status" });
  assert.equal(settings.revision, 0);
  assert.ok(settings.providers.some((p) => p.id === "local"));
  assert.ok(!settings.providers.some((p) => p.id === "chatgpt-plan"));
  const requestId = randomUUID(),
    secret = `synthetic-native-setup-${randomUUID()}`;
  try {
    const configuration = {
      provider: "openai-api",
      endpoint: "http://127.0.0.1:1/v1",
      model: "synthetic-model",
    };
    const command = {
      requestId,
      expectedRevision: 0,
      configuration,
      secret,
      clearSecret: false,
    };
    const saved = await provider(active, id, { type: "save", command });
    assert.equal(saved.revision, 1);
    assert.equal(saved.credentialAvailable, true);
    assert.ok(!JSON.stringify(saved).includes(secret));
    assert.equal(
      (await provider(active, id, { type: "save", command })).revision,
      1,
    );
    assert.ok(
      (
        await invoke(active, "desktop_ai_providers", {
          request: {
            sessionId: id,
            program: "/forged",
            action: { type: "status" },
          },
        })
      ).failure,
    );
    let status = await compute(active, id, { type: "status" });
    assert.equal(status.runtime.state, "off");
    assert.equal(status.settings.sharing, false);
    const computeId = randomUUID();
    await compute(active, id, {
      type: "command",
      command: {
        requestId: computeId,
        expectedRevision: 0,
        action: {
          type: "configure",
          settings: { ...status.settings, memoryGb: 2 },
        },
      },
    });
    await active.browser.waitUntil(
      async () => {
        status = await compute(active, id, { type: "status" });
        return status.outcome === "completed";
      },
      { timeout: 10000 },
    );
    assert.equal(status.settings.revision, 1);
    assert.equal(status.runtime.state, "off");
    assert.equal(
      existsSync(join(root, "profile/ai-compute/compute")),
      false,
      "No compute helper/cache is created by configuration",
    );
  } finally {
    const current = await provider(active, id, { type: "status" });
    if (current.credentialAvailable)
      await provider(active, id, {
        type: "save",
        command: {
          requestId: randomUUID(),
          expectedRevision: current.revision,
          configuration: current.configuration,
          secret: null,
          clearSecret: true,
        },
      });
  }
  await active.close(true);
  active = await nativeSession("ai-setup-api-cold", root, undefined, [], {
    background: true,
  });
  const coldId = await select(active, root, vault);
  const restored = await provider(active, coldId, { type: "status" });
  assert.equal(restored.credentialAvailable, false);
  assert.equal(restored.revision, 2);
  const cold = await compute(active, coldId, { type: "status" });
  assert.equal(cold.settings.memoryGb, 2);
  assert.equal(cold.runtime.state, "off");
  assert.equal(cold.outcome, "completed");
  await active.close(true);
  console.log(`Cold native setup evidence: ${root}`);
});
