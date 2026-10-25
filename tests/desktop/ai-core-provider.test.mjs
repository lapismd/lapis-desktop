import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID, createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { nativeSession } from "./native-session.mjs";
import { invoke } from "./ai-provider-fixture.mjs";

test(
  "real Codex Core turn finishes after reload detach and retains its exact record cold",
  { skip: process.env.LAPIS_AI_TEST_CORE_PROVIDER !== "1", timeout: 240000 },
  async (context) => {
    const configuration = process.env.LAPIS_AI_TEST_RUNTIME_CONFIG;
    assert.ok(
      configuration,
      "Set LAPIS_AI_TEST_RUNTIME_CONFIG explicitly for real-provider acceptance",
    );
    const previous = {
      LAPIS_DESKTOP_AI_OWNER: process.env.LAPIS_DESKTOP_AI_OWNER,
      LAPIS_DESKTOP_ACCEPTANCE_NATIVE_AI:
        process.env.LAPIS_DESKTOP_ACCEPTANCE_NATIVE_AI,
    };
    context.after(() => {
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    });
    process.env.LAPIS_DESKTOP_AI_OWNER = "core";
    process.env.LAPIS_DESKTOP_ACCEPTANCE_NATIVE_AI = "1";
    mkdirSync(resolve(".local/native-test"), { recursive: true });
    const root = mkdtempSync(
      resolve(".local/native-test/core-provider-detach-"),
    );
    const vault = join(root, "Vault");
    mkdirSync(vault);
    mkdirSync(join(root, "profile"));
    writeFileSync(
      join(vault, "Note.md"),
      "# Isolated provider qualification\n",
    );
    writeFileSync(
      join(root, "profile/ai-runtime.json"),
      readFileSync(configuration),
    );
    const requestId = randomUUID();
    const witness = `DETACH-${randomUUID()}`;
    const receipt = { root, requestId, witness, stages: [] };
    function save(stage, facts = {}) {
      receipt.stages.push({ stage, at: new Date().toISOString(), ...facts });
      writeFileSync(
        join(root, "receipt.json"),
        JSON.stringify(receipt, null, 2),
      );
      console.log(stage, JSON.stringify(facts));
    }
    let session;
    async function launch(name) {
      session = await nativeSession(name, root, undefined, [], {
        background: true,
      });
      writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
      const descriptor = await invoke(session, "vault_select");
      await invoke(session, "desktop_ai_admit", {
        request: { sessionId: descriptor.sessionId },
      });
      return descriptor;
    }
    async function command(descriptor, command) {
      return invoke(session, "desktop_ai_turn", {
        request: { sessionId: descriptor.sessionId, command },
      });
    }
    try {
      let descriptor = await launch("core-provider-detach");
      const targets = await command(descriptor, { kind: "targets" });
      assert.ok(targets.targets.some((t) => t.id === "codex"));
      const input = {
        request_id: requestId,
        target_id: "codex",
        scope_dir: "",
        context: null,
        prompt: `Return exactly the string ${witness}. Do not inspect files or use tools.`,
        options: {
          model: "gpt-5.6-sol",
          effort: null,
          mode: "read-only",
          max_duration_ms: 120000,
        },
      };
      const accepted = await command(descriptor, { kind: "submit", input });
      assert.equal(accepted.record.input.request_id, requestId);
      assert.ok(["accepted", "running"].includes(accepted.record.phase));
      save("accepted", {
        phase: accepted.record.phase,
        vaultId: descriptor.profileId,
        conversationId: accepted.record.conversation_id,
      });
      await invoke(session, "desktop_ai_release", {
        request: { reload: true },
      });
      await invoke(session, "vault_close", {
        sessionId: descriptor.sessionId,
        reload: true,
      });
      const journal = join(
        root,
        "profile/turns",
        accepted.record.vault_id,
        `${requestId}.json`,
      );
      const detached = JSON.parse(readFileSync(journal, "utf8"));
      assert.ok(
        ["accepted", "running"].includes(detached.phase),
        "Detach must precede completion",
      );
      save("detached", { phase: detached.phase });
      let record;
      const deadline = Date.now() + 150000;
      do {
        await delay(250);
        record = JSON.parse(readFileSync(journal, "utf8"));
      } while (
        ["accepted", "running"].includes(record.phase) &&
        Date.now() < deadline
      );
      save("terminal-without-client", {
        phase: record.phase,
        failureCode: record.failure_code,
        output: record.output,
      });
      assert.equal(record.phase, "completed");
      assert.equal(record.output.trim(), witness);
      descriptor = await (async () => {
        writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
        const fresh = await invoke(session, "vault_select");
        await invoke(session, "desktop_ai_admit", {
          request: { sessionId: fresh.sessionId },
        });
        return fresh;
      })();
      assert.deepEqual(
        (await command(descriptor, { kind: "read", request_id: requestId }))
          .record,
        record,
      );
      const portable = join(
        vault,
        ".lapis/agents/sessions",
        record.conversation_id,
        "transcript.jsonl",
      );
      const hash = () =>
        createHash("sha256").update(readFileSync(portable)).digest("hex");
      const before = hash();
      await invoke(session, "desktop_ai_release", {
        request: { reload: false },
      });
      await invoke(session, "vault_close", { sessionId: descriptor.sessionId });
      await session.close(true);
      save("clean-quit", { transcriptSha256: before });
      descriptor = await launch("core-provider-cold");
      const cold = (
        await command(descriptor, { kind: "read", request_id: requestId })
      ).record;
      assert.deepEqual(cold, record);
      assert.equal(hash(), before);
      await delay(1000);
      assert.equal(hash(), before);
      save("cold-retained-without-replay", {
        phase: cold.phase,
        transcriptSha256: hash(),
      });
      await invoke(session, "desktop_ai_release", {
        request: { reload: false },
      });
      await invoke(session, "vault_close", { sessionId: descriptor.sessionId });
      await session.close(true);
      save("complete");
    } catch (error) {
      save("failed", { error: String(error.stack ?? error) });
      throw error;
    } finally {
      if (session?.isRunning()) await session.cleanup();
    }
  },
);
