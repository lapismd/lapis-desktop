import { expect, it, vi } from "vitest";
import { NativeConversationWorkspace } from "../../../src/lib/ai/conversations/native-workspace.ts";
import { nativeReaderPort } from "../../../catalog/support/ai/native/port.ts";
import { owner } from "../../../catalog/support/ai/native/facts.ts";
import { deferred } from "./managed-turn-fixture.ts";
import type { OpenedConversationBackend } from "../../../src/lib/ai/conversations/backend-port.ts";

function fixture() {
  const native = nativeReaderPort("authored");
  const selection = vi
    .spyOn(native.port, "selection")
    .mockResolvedValue(native.opened.selection);
  const open = vi.spyOn(native.port, "open").mockResolvedValue(native.opened);
  const close = vi.spyOn(native.port, "close").mockResolvedValue();
  const select = vi.spyOn(native.port, "select");
  const closeRead = vi.spyOn(native.port, "closeRead");
  const error = vi.fn();
  const workspace = new NativeConversationWorkspace(native.port, error);
  return {
    native,
    workspace,
    selection,
    open,
    close,
    select,
    closeRead,
    error,
  };
}

it("shares one explicit native backend while panes own separate reader lifetimes", async () => {
  const f = fixture();
  const [a, b] = await Promise.all([
    f.workspace.acquireReader(),
    f.workspace.acquireReader(),
  ]);
  expect(f.selection).toHaveBeenCalledOnce();
  expect(f.open).toHaveBeenCalledOnce();
  expect(f.open.mock.calls[0]![0]).toMatch(/^[a-f0-9]{32}$/u);
  expect(a.reader).not.toBe(b.reader);
  expect(a.reader.catalog).toBe(b.reader.catalog);
  await a.reader.refresh();
  await Promise.all([
    a.reader.select(owner.threadId),
    b.reader.select(owner.threadId),
  ]);
  expect(a.reader.state.conversation!.handle).not.toBe(
    b.reader.state.conversation!.handle,
  );
  await a.close();
  expect(f.close).not.toHaveBeenCalled();
  expect(b.reader.state.conversation).toBeDefined();
  await b.reader.select(owner.threadId);
  await f.workspace.close();
  expect(f.close).toHaveBeenCalledExactlyOnceWith(f.native.opened.handle);
  expect(f.select).not.toHaveBeenCalled();
});

it("opens an exact restored route before catalog pagination without treating it as authority", async () => {
  const f = fixture();
  const lease = await f.workspace.acquireReader();
  const catalog = vi.spyOn(f.native.port.canonical, "list");
  const original = await f.native.port.canonical.openRead(
    f.native.opened.handle,
    owner.threadId,
  );
  await f.native.port.closeRead(f.native.opened.handle, original!.handle);
  await lease.reader.selectRoute(original!.identity);
  expect(lease.reader.state.conversation!.identity).toEqual(original!.identity);
  expect(catalog).not.toHaveBeenCalled();
  const pin = lease.reader.state.conversation!.handle;
  await expect(
    lease.reader.selectRoute({
      ...original!.identity,
      target: { type: "conversation", id: "foreign:opaque" },
    }),
  ).rejects.toThrow(/identity changed/i);
  expect(lease.reader.state.conversation!.handle).toBe(pin);
  expect(f.error).toHaveBeenCalledOnce();
  await f.workspace.close();
});

it("does not silently select JJ or retry an unavailable/lost native open", async () => {
  const f = fixture();
  f.selection.mockResolvedValueOnce({ backend: "vault-files", revision: 0 });
  const first = f.workspace.open();
  await expect(first).rejects.toThrow(/Select native/);
  expect(f.workspace.open()).toBe(first);
  expect(f.open).not.toHaveBeenCalled();
  expect(f.select).not.toHaveBeenCalled();
  await f.workspace.close();
  const lost = fixture();
  lost.open.mockRejectedValueOnce(new Error("Native open reply lost"));
  const attempt = lost.workspace.open();
  await expect(attempt).rejects.toThrow(/reply lost/);
  expect(lost.workspace.open()).toBe(attempt);
  await lost.workspace.close();
  expect(lost.open).toHaveBeenCalledOnce();
  expect(lost.close).not.toHaveBeenCalled();
});

it("retains and closes a handle whose open reply races application closure", async () => {
  const f = fixture(),
    pending = deferred<OpenedConversationBackend>();
  f.open.mockReturnValueOnce(pending.promise);
  const acquiring = f.workspace.acquireReader();
  const rejected = expect(acquiring).rejects.toThrow(/closed/);
  await vi.waitFor(() => expect(f.open).toHaveBeenCalledOnce());
  const closing = f.workspace.close();
  pending.resolve(f.native.opened);
  await rejected;
  await closing;
  expect(f.close).toHaveBeenCalledExactlyOnceWith(f.native.opened.handle);
});

it("retains failed read cleanup and closes the backend only after the same pin drains", async () => {
  const f = fixture();
  const lease = await f.workspace.acquireReader();
  await lease.reader.refresh();
  await lease.reader.select(owner.threadId);
  const pin = lease.reader.state.conversation!.handle;
  f.closeRead.mockRejectedValueOnce(new Error("Read close unknown"));
  await expect(f.workspace.close()).rejects.toThrow(/readers could not close/);
  expect(f.close).not.toHaveBeenCalled();
  await f.workspace.close();
  expect(f.closeRead).toHaveBeenNthCalledWith(1, f.native.opened.handle, pin);
  expect(f.closeRead).toHaveBeenNthCalledWith(2, f.native.opened.handle, pin);
  expect(f.close).toHaveBeenCalledOnce();
});

it("retains an exact failed backend close for explicit retry without opening a replacement", async () => {
  const f = fixture();
  await f.workspace.acquireReader();
  f.close.mockRejectedValueOnce(new Error("Backend close unknown"));
  await expect(f.workspace.close()).rejects.toThrow(/close unknown/);
  await f.workspace.close();
  expect(f.close).toHaveBeenCalledTimes(2);
  expect(
    f.close.mock.calls.every(([handle]) => handle === f.native.opened.handle),
  ).toBe(true);
  expect(f.open).toHaveBeenCalledOnce();
});

it("fails without native services instead of allocating a file store", async () => {
  const workspace = new NativeConversationWorkspace(undefined, vi.fn());
  await expect(workspace.open()).rejects.toThrow(/unavailable/);
  await workspace.close();
});
