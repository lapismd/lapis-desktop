import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ACP_AGENT_IDS } from "../../src/lib/ai/settings/acp-agents.ts";
import { recipientFromOption } from "../../src/lib/ai/conversations/recipients.ts";
import { captureQueuedMessage } from "../../src/lib/ai/chat/controller/queue-capture.ts";
const labels = {
  codex: "Codex",
  cursor: "Cursor",
  opencode: "OpenCode",
  local: "Lapis AI",
};

test("one host-owned declaration preserves the complete existing builtin recipient codec", () => {
  const catalog = JSON.parse(
    readFileSync(
      new URL("../../config/ai/queue-recipients.json", import.meta.url),
      "utf8",
    ),
  );
  assert.deepEqual(
    catalog.map((entry) => entry.runner),
    [...ACP_AGENT_IDS],
  );
  for (const entry of catalog) {
    assert.equal(entry.agent, entry.runner);
    assert.deepEqual(
      entry.recipient,
      recipientFromOption({
        id: entry.runner,
        label: labels[entry.runner],
        agent: entry.runner,
      }),
    );
    assert.deepEqual(Object.keys(entry).sort(), [
      "agent",
      "recipient",
      "runner",
    ]);
  }
});
test("existing default capture callers retain their exact saved recipient and selected mode", () => {
  for (const agent of ACP_AGENT_IDS) {
    const executionMode =
      agent === "codex" ? "read-only" : agent === "opencode" ? "plan" : "ask";
    const captured = captureQueuedMessage("  Follow up  ", {
      agent,
      executionMode,
    });
    assert.deepEqual(captured.user.recipients, [
      recipientFromOption({ id: agent, label: labels[agent], agent }),
    ]);
    assert.deepEqual(captured.selection.targets, [
      { id: agent, agent, executionMode },
    ]);
    assert.equal(captured.user.text, "Follow up");
  }
});
