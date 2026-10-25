import { browser } from "@wdio/globals";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const profile = process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT;
let selected;

describe("shared Rust database public consumer conformance", () => {
  before(async () => {
    await browser.waitUntil(() =>
      browser.execute(() =>
        Boolean(globalThis.__lapisNativeDatabaseAcceptance),
      ),
    );
    writeFileSync(
      join(profile, "picker.json"),
      JSON.stringify(join(profile, "vault-笔记 café")),
    );
    selected = await browser.tauri.execute(({ core }) =>
      core.invoke("vault_select", { createName: null }),
    );
  });

  it("opens the actual packed AppDatabase provider over Rust and persists metadata", async () => {
    const descriptor = await browser.execute(
      (selected) => globalThis.__lapisNativeDatabaseAcceptance.open(selected),
      selected,
    );
    assert.equal(descriptor.engine, "turso");
    assert.equal(descriptor.providerId, "turso-native-desktop");
    assert.equal(descriptor.transport, "native");
    assert.equal(descriptor.role, "direct");
    const value = {
      text: "café 🪨",
      count: 42,
      nested: { enabled: true },
      bytes: [0, 255, 128],
    };
    await browser.execute(
      (selected, value) =>
        globalThis.__lapisNativeDatabaseAcceptance.set(
          selected.sessionId,
          "acceptance.native",
          value,
        ),
      selected,
      value,
    );
    const result = await browser.execute(
      (selected) =>
        globalThis.__lapisNativeDatabaseAcceptance.get(
          selected.sessionId,
          "acceptance.native",
        ),
      selected,
    );
    assert.deepEqual(result, value);
  });

  it("forwards committed changes through the actual Tauri channel", async () => {
    await browser.execute(async (selected) => {
      const core = globalThis.__TAURI__.core;
      const changes = [];
      const channel = new core.Channel((change) => changes.push(change));
      globalThis.__lapisDatabaseChangeAcceptance = { changes, channel };
      const { connectionId } = await core.invoke("vault_db_open", {
        sessionId: selected.sessionId,
        onChange: channel,
      });
      await core.invoke("vault_db_call", {
        sessionId: selected.sessionId,
        connectionId,
        request: {
          method: "setMeta",
          args: [
            { kind: "value", value: "acceptance.native-channel" },
            { kind: "value", value: "committed" },
          ],
        },
      });
    }, selected);
    await browser.waitUntil(() =>
      browser.execute(() =>
        globalThis.__lapisDatabaseChangeAcceptance.changes.some(
          (change) => change.domains.includes("meta") && change.revision > 0,
        ),
      ),
    );
  });

  it("requires live owner admissions and prevents vault close while the database is live", async () => {
    const denials = await browser.tauri.execute(async ({ core }, selected) => {
      const { connectionId } = await core.invoke("vault_db_open", {
        sessionId: selected.sessionId,
      });
      const attempts = [
        ["vault_db_open", { sessionId: "unknown" }],
        [
          "vault_db_call",
          {
            sessionId: "unknown",
            connectionId,
            request: { method: "getMeta", args: [] },
          },
        ],
        [
          "vault_db_call",
          {
            sessionId: selected.sessionId,
            connectionId: "unknown",
            request: { method: "getMeta", args: [] },
          },
        ],
        [
          "vault_db_call",
          {
            sessionId: selected.sessionId,
            connectionId,
            request: {
              operation: "exec",
              sql: "ATTACH DATABASE '/tmp/outside' AS outside",
            },
          },
        ],
        ["vault_close", { sessionId: selected.sessionId }],
      ];
      return Promise.all(
        attempts.map(async ([command, payload]) => {
          try {
            await core.invoke(command, payload);
            return false;
          } catch {
            return true;
          }
        }),
      );
    }, selected);
    assert.deepEqual(denials, [true, true, true, true, true]);
  });

  it("closes and reopens the native database with committed shared-API metadata intact", async () => {
    const result = await browser.execute(async (selected) => {
      const driver = globalThis.__lapisNativeDatabaseAcceptance;
      await driver.close(selected.sessionId);
      const descriptor = await driver.open(selected);
      const value = await driver.get(selected.sessionId, "acceptance.native");
      await driver.close(selected.sessionId);
      return { descriptor, value };
    }, selected);
    assert.equal(result.descriptor.transport, "native");
    assert.equal(result.value.text, "café 🪨");
    await browser.execute(() => {
      delete globalThis.__lapisDatabaseChangeAcceptance;
    });
    await browser.tauri.execute(
      ({ core }, selected) =>
        core.invoke("vault_close", { sessionId: selected.sessionId }),
      selected,
    );
  });
});
