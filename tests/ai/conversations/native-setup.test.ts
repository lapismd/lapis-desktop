import { expect, it, vi } from "vitest";
import { NativeConversationSetup } from "../../../src/lib/ai/conversations/native-setup.ts";
import { NativeConversationWorkspace } from "../../../src/lib/ai/conversations/native-workspace.ts";
import type { BackendSelection } from "../../../src/lib/ai/conversations/backend-port.ts";
import { nativeReaderPort } from "../../../catalog/support/ai/native/port.ts";
import { owner, uuid } from "../../../catalog/support/ai/native/facts.ts";
import { deferred } from "./managed-turn-fixture.ts";

function fixture(
  initial: BackendSelection = { backend: "vault-files", revision: 0 },
) {
  const native = nativeReaderPort("authored");
  let selected = structuredClone(initial);
  const selection = vi
    .spyOn(native.port, "selection")
    .mockImplementation(async () => structuredClone(selected));
  const select = vi
    .spyOn(native.port, "select")
    .mockImplementation(async (request, expectedRevision, backend) => {
      selected = { backend, revision: expectedRevision + 1 };
      return {
        request_id: request,
        expected_revision: expectedRevision,
        selection: structuredClone(selected),
      };
    });
  const choiceStatus = vi
    .spyOn(native.port, "selectionStatus")
    .mockResolvedValue(null);
  const open = vi.spyOn(native.port, "open").mockImplementation(async () => ({
    ...native.opened,
    selection: structuredClone(selected),
  }));
  const close = vi.spyOn(native.port, "close").mockResolvedValue();
  const prepare = vi
    .spyOn(native.port, "prepare")
    .mockImplementation(async (_handle, request) => ({
      requestId: request,
      conversationId: uuid(88),
      threadId: owner.threadId,
      repository: owner.repository,
      receipt: "native provider proof",
    }));
  const status = vi
    .spyOn(native.port, "preparationStatus")
    .mockResolvedValue(null);
  const report = vi.fn();
  let setup!: NativeConversationSetup;
  const workspace = new NativeConversationWorkspace(
    native.port,
    report,
    () => [],
    () => setup.openingAllowed,
  );
  setup = new NativeConversationSetup(native.port, workspace, report);
  return {
    native,
    selection,
    select,
    choiceStatus,
    open,
    close,
    prepare,
    status,
    report,
    workspace,
    setup,
    setSelection: (value: BackendSelection) => {
      selected = value;
    },
    finish: async () => {
      await setup.close();
      await workspace.close();
    },
  };
}

it("allocates no storage/provider at construction or a read-only Settings refresh", async () => {
  const f = fixture();
  expect(f.selection).not.toHaveBeenCalled();
  await f.setup.refresh();
  expect(f.setup.state.selection).toEqual({
    backend: "vault-files",
    revision: 0,
  });
  expect(f.select).not.toHaveBeenCalled();
  expect(f.open).not.toHaveBeenCalled();
  expect(f.prepare).not.toHaveBeenCalled();
  await f.finish();
});

it("applies only an explicit choice with the observed revision and original receipt", async () => {
  const f = fixture();
  await f.setup.choose("jj");
  expect(f.select).toHaveBeenCalledOnce();
  expect(f.select.mock.calls[0]![0]).toMatch(/^[a-f0-9]{32}$/u);
  expect(f.select.mock.calls[0]!.slice(1)).toEqual([0, "jj"]);
  expect(f.setup.state.pendingChoice).toBeUndefined();
  expect(f.setup.state.selection).toEqual({ backend: "jj", revision: 1 });
  expect(f.open).not.toHaveBeenCalled();
  await f.finish();
});

it("allows an explicit choice after an earlier unselected native history open", async () => {
  const f = fixture();
  await expect(f.workspace.open()).rejects.toThrow(/Select native/);
  expect(f.open).not.toHaveBeenCalled();
  await f.setup.choose("jj");
  const reader = await f.workspace.acquireReader();
  expect(f.open).toHaveBeenCalledOnce();
  await reader.close();
  await f.finish();
});

it("retains a lost choice and reads its status without another mutation or open", async () => {
  const f = fixture();
  f.select.mockRejectedValueOnce(new Error("Choice reply lost"));
  await expect(f.setup.choose("jj")).rejects.toThrow(/lost/);
  const pending = f.setup.state.pendingChoice!;
  expect(() => f.workspace.open()).toThrow(/Resolve/);
  await f.setup.refresh();
  expect(f.setup.state.pendingChoice).toEqual(pending);
  await expect(f.setup.choose("jj")).rejects.toThrow(/original/);
  f.setSelection({ backend: "jj", revision: 1 });
  f.choiceStatus.mockResolvedValueOnce({
    request_id: pending.request,
    expected_revision: 0,
    selection: { backend: "jj", revision: 1 },
  });
  await f.setup.refresh();
  expect(
    f.choiceStatus.mock.calls.every(([request]) => request === pending.request),
  ).toBe(true);
  expect(f.select).toHaveBeenCalledOnce();
  expect(f.open).not.toHaveBeenCalled();
  expect(f.setup.state.pendingChoice).toBeUndefined();
  await f.finish();
});

it("rejects a recovered receipt for a different original choice", async () => {
  const f = fixture();
  f.select.mockResolvedValueOnce(null);
  await expect(f.setup.choose("jj")).rejects.toThrow(/unconfirmed/);
  const pending = f.setup.state.pendingChoice!;
  f.choiceStatus.mockResolvedValueOnce({
    request_id: pending.request,
    expected_revision: 0,
    selection: { backend: "vault-files", revision: 1 },
  });
  await expect(f.setup.refresh()).rejects.toThrow(/original choice/);
  expect(f.setup.state.pendingChoice).toEqual(pending);
  expect(f.setup.openingAllowed).toBe(false);
  await f.finish();
});

it("preserves active native panes, then closes an idle exact owner before switching", async () => {
  const f = fixture({ backend: "jj", revision: 1 });
  const reader = await f.workspace.acquireReader();
  await expect(f.setup.choose("vault-files")).rejects.toThrow(/Close native/);
  expect(f.select).not.toHaveBeenCalled();
  expect(f.close).not.toHaveBeenCalled();
  await reader.close();
  await f.setup.choose("vault-files");
  expect(f.close).toHaveBeenCalledExactlyOnceWith(f.native.opened.handle);
  await f.setup.choose("jj");
  const next = await f.workspace.acquireReader();
  expect(f.open.mock.calls[0]![0]).not.toBe(f.open.mock.calls[1]![0]);
  await next.close();
  await f.finish();
});

it("preserves a native pane whose initial backend open is still pending", async () => {
  const f = fixture({ backend: "jj", revision: 1 });
  const pending = deferred<typeof f.native.opened>();
  f.open.mockReturnValueOnce(pending.promise);
  const acquiring = f.workspace.acquireReader();
  await vi.waitFor(() => expect(f.open).toHaveBeenCalledOnce());
  await expect(f.setup.choose("vault-files")).rejects.toThrow(/Close native/);
  expect(f.select).not.toHaveBeenCalled();
  expect(f.close).not.toHaveBeenCalled();
  pending.resolve(f.native.opened);
  const reader = await acquiring;
  await reader.close();
  await f.finish();
});

it("retains a failed exact backend close and does not select until that close succeeds", async () => {
  const f = fixture({ backend: "jj", revision: 1 });
  const reader = await f.workspace.acquireReader();
  await reader.close();
  f.close.mockRejectedValueOnce(new Error("Close unknown"));
  await expect(f.setup.choose("vault-files")).rejects.toThrow(/unknown/);
  expect(f.select).not.toHaveBeenCalled();
  expect(() => f.workspace.acquireReader()).toThrow(/Resolve/);
  await f.setup.choose("vault-files");
  expect(
    f.close.mock.calls.every(([handle]) => handle === f.native.opened.handle),
  ).toBe(true);
  expect(f.select).toHaveBeenCalledOnce();
  await f.finish();
});

it("does not replace an unknown native open while selecting storage", async () => {
  const f = fixture({ backend: "jj", revision: 1 });
  f.open.mockRejectedValueOnce(new Error("Open reply lost"));
  await expect(f.workspace.open()).rejects.toThrow(/lost/);
  await expect(f.setup.choose("vault-files")).rejects.toThrow(
    /original native open/,
  );
  expect(f.select).not.toHaveBeenCalled();
  expect(f.open).toHaveBeenCalledOnce();
  await f.finish();
});

it("creates one native conversation with its exact title and returns only confirmed native identity", async () => {
  const f = fixture({ backend: "jj", revision: 1 });
  const reference = await f.setup.create("Review notes 研究");
  expect(f.prepare).toHaveBeenCalledOnce();
  expect(f.prepare.mock.calls[0]![2]).toBe("Review notes 研究");
  expect(reference).toEqual({
    target: { type: "conversation", id: uuid(88) },
    threadId: owner.threadId,
    repository: owner.repository,
  });
  expect(reference).not.toHaveProperty("scopeDir");
  expect(f.select).not.toHaveBeenCalled();
  await f.finish();
});

it("keeps an uncertain creation/title and observes only the original native status", async () => {
  const f = fixture({ backend: "jj", revision: 1 });
  f.prepare.mockRejectedValueOnce(new Error("Preparation reply lost"));
  await expect(f.setup.create("Original title")).rejects.toThrow(/lost/);
  const creation = f.setup.state.creation!;
  expect(await f.setup.recoverCreation()).toBeUndefined();
  await expect(f.setup.create("Another title")).rejects.toThrow(/original/);
  f.status.mockResolvedValueOnce({
    requestId: creation.request,
    conversationId: uuid(88),
    threadId: owner.threadId,
    repository: owner.repository,
    receipt: "recovered native proof",
  });
  expect((await f.setup.recoverCreation())!.target).toEqual({
    type: "conversation",
    id: uuid(88),
  });
  expect(
    f.status.mock.calls.every(([, request]) => request === creation.request),
  ).toBe(true);
  expect(f.prepare).toHaveBeenCalledOnce();
  expect(f.setup.state.creation!.title).toBe("Original title");
  await f.finish();
});

it("rejects changed identity after an unconfirmed creation reply", async () => {
  const f = fixture({ backend: "jj", revision: 1 });
  f.prepare.mockImplementationOnce(async (_handle, request) => ({
    requestId: request,
    conversationId: uuid(88),
    threadId: owner.threadId,
    repository: null,
    receipt: null,
  }));
  expect(await f.setup.create("Original title")).toBeUndefined();
  const creation = f.setup.state.creation!;
  f.status.mockResolvedValueOnce({
    requestId: creation.request,
    conversationId: uuid(89),
    threadId: owner.threadId,
    repository: owner.repository,
    receipt: "wrong proof",
  });
  await expect(f.setup.recoverCreation()).rejects.toThrow(/original identity/);
  expect(f.setup.state.creation).toEqual(creation);
  expect(f.prepare).toHaveBeenCalledOnce();
  await f.finish();
});

it("drains a selection read after shutdown without starting its queued mutation", async () => {
  const f = fixture(),
    pending = deferred<BackendSelection>();
  f.selection.mockReturnValueOnce(pending.promise);
  const choosing = f.setup.choose("jj"),
    rejected = expect(choosing).rejects.toThrow(/closed/);
  await vi.waitFor(() => expect(f.selection).toHaveBeenCalledOnce());
  const closing = f.setup.close();
  pending.resolve({ backend: "vault-files", revision: 0 });
  await rejected;
  await closing;
  expect(f.select).not.toHaveBeenCalled();
  await f.workspace.close();
});

it("retains backend authority for a turn after its pane closes", async () => {
  const f = fixture({ backend: "jj", revision: 1 });
  const reader = await f.workspace.acquireReader(),
    release = f.workspace.retainTurn(reader.opened);
  await reader.close();
  await expect(f.setup.choose("vault-files")).rejects.toThrow(/Close native/);
  expect(f.close).not.toHaveBeenCalled();
  release();
  await f.setup.choose("vault-files");
  expect(f.close).toHaveBeenCalledOnce();
  await f.finish();
});
