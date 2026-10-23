import { test } from "vitest";
import assert from "node:assert/strict";
import { DesktopChatPort } from "../../src/lib/ai/shared/chat-port.ts";
import { desktopChatPresentation } from "../../src/lib/ai/shared/chat-presentation.ts";
import { DesktopActionRecovery } from "../../src/lib/ai/shared/action-recovery.ts";
function fixture() {
  let reads = 0,
    sends = 0;
  const snapshot = {
    sessions: [],
    capabilities: [],
    requests: [],
    queued: [],
    catalog: [],
    imports: [],
    agents: [],
    busy: false,
  };
  const location = { scopeDir: "Notes", conversationId: "conversation-one" };
  const panel = {
    controller: {
      items: [{ id: "old", type: "message", role: "user", text: "hello" }],
      location,
      repository: {
        read: async () => {
          reads++;
          return { transcript: panel.controller.items };
        },
      },
    },
    composerState: {
      draftReady: true,
      catalogState: { loading: false },
      permissions: { loading: false, saving: false },
    },
    attachmentsState: {},
    conversationsState: {},
    panelProps: {},
    actions: {
      submitTranscript: async () => {
        sends++;
        return false;
      },
    },
  };
  const port = new DesktopChatPort(
    () => panel,
    () => snapshot,
    () => [],
  );
  const action = {
    id: "request-one",
    kind: "send",
    submission: { id: "request-one", text: "hello", comments: [] },
  };
  return {
    panel,
    port,
    action,
    snapshot,
    location,
    get reads() {
      return reads;
    },
    get sends() {
      return sends;
    },
  };
}
test("composer loading and busy without storage refuse before dispatch", async () => {
  for (const blocked of ["catalog", "permissions", "busy"]) {
    const f = fixture();
    if (blocked === "catalog")
      f.panel.composerState.catalogState.loading = true;
    if (blocked === "permissions")
      f.panel.composerState.permissions.saving = true;
    if (blocked === "busy") {
      f.panel.controller.busy = true;
      f.panel.controller.repository = undefined;
    }
    assert.equal((await f.port.act(f.action)).status, "refused");
    assert.equal(f.sends, 0);
  }
});
test("lost send acknowledgement recovers only its newly retained native user identity without replay", async () => {
  const f = fixture(),
    recovery = new DesktopActionRecovery();
  recovery.begin(f.action, f.panel);
  assert.equal(
    (await recovery.status(f.action.id, f.panel, () => f.snapshot)).status,
    "unknown",
  );
  f.panel.controller.items.push({
    id: "native-new",
    type: "message",
    role: "user",
    text: "hello",
  });
  recovery.capture(f.panel);
  assert.equal(
    (await recovery.status(f.action.id, f.panel, () => f.snapshot)).status,
    "acknowledged",
  );
  assert.equal(
    (await recovery.status("another-request", f.panel, () => f.snapshot))
      .status,
    "unknown",
  );
  assert.equal(f.sends, 0);
  assert.equal(f.reads, 2);
});
test("same text in another conversation cannot acknowledge an unknown send", async () => {
  const f = fixture(),
    recovery = new DesktopActionRecovery();
  recovery.begin(f.action, f.panel);
  f.panel.controller.location = { ...f.location, conversationId: "other" };
  f.panel.controller.items = [
    { id: "foreign", type: "message", role: "user", text: "hello" },
  ];
  recovery.capture(f.panel);
  assert.equal(
    (await recovery.status(f.action.id, f.panel, () => f.snapshot)).status,
    "unknown",
  );
  assert.equal(f.sends, 0);
});
test("response recovery uses the original advertised request in its original conversation", async () => {
  const f = fixture(),
    recovery = new DesktopActionRecovery();
  recovery.begin(
    { id: "answer", kind: "respond", target: "permission-one" },
    f.panel,
  );
  f.panel.controller.items.push({
    id: "approval",
    type: "approval",
    request: { id: "permission-one" },
    status: "approved",
  });
  assert.equal(
    (await recovery.status("answer", f.panel, () => f.snapshot)).status,
    "acknowledged",
  );
  f.panel.controller.location = { ...f.location, conversationId: "other" };
  assert.equal(
    (await recovery.status("answer", f.panel, () => f.snapshot)).status,
    "unknown",
  );
});

test("native retryable refusal is distinct from an unknown native turn", () => {
  const f = fixture(),
    recovery = new DesktopActionRecovery();
  recovery.begin(f.action, f.panel);
  f.panel.controller.items.push({
    id: "error-new",
    type: "error",
    text: "Provider refused before dispatch",
  });
  assert.equal(recovery.refusal(f.panel), "Provider refused before dispatch");
  f.panel.controller.items.at(-1).retryable = false;
  assert.equal(recovery.refusal(f.panel), undefined);
});

test("new native conversation capture owns its single refusal status", () => {
  const f = fixture();
  f.panel.controller.location = null;
  f.port.recovery.begin(f.action, f.panel);
  const status = { type: "error", message: "Native execution unavailable" };
  f.panel.composerState.composerStatus = status;
  const presentation = desktopChatPresentation(
    () => f.panel,
    () => f.port.recovery.refusal(f.panel),
  );
  assert.equal(presentation.composerState.composerStatus, status);
  f.panel.controller.location = f.location;
  f.panel.controller.items.push(
    { id: "new-user", type: "message", role: "user", text: "hello" },
    { id: "new-error", type: "error", text: status.message },
  );
  f.port.recovery.capture(f.panel);
  assert.equal(presentation.composerState.composerStatus, undefined);
  f.panel.controller.location = { ...f.location, conversationId: "other" };
  assert.equal(presentation.composerState.composerStatus, status);
  f.panel.controller.location = f.location;
  f.panel.controller.items.pop();
  assert.equal(presentation.composerState.composerStatus, status);
});
