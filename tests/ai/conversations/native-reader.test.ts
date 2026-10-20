import { expect, it, vi } from "vitest";
import {
  CanonicalConversationCatalog,
  type CanonicalReadLease,
} from "../../../src/lib/ai/conversations/canonical-catalog.ts";
import { NativeConversationReader } from "../../../src/lib/ai/conversations/native-reader.ts";
import { nativeReaderPort } from "../../../catalog/support/ai/native/port.ts";
import { owner } from "../../../catalog/support/ai/native/facts.ts";

function gate<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function fixture(scenario: "authored" | "read-failure" = "authored") {
  const native = nativeReaderPort(scenario),
    catalog = new CanonicalConversationCatalog(native.port, native.opened),
    notify = vi.fn();
  return {
    native,
    catalog,
    notify,
    reader: new NativeConversationReader(catalog, notify),
  };
}

it("retains the previous successful source and reports one failure, then retries the same native pin", async () => {
  const { reader, catalog, notify } = fixture("read-failure");
  await reader.refresh();
  await reader.select(owner.threadId);
  const before = reader.state,
    cursor = before.conversation!.recordSources[0]!.cursor;
  await expect(reader.selectSource(cursor)).rejects.toThrow(
    /record read failed/,
  );
  expect(reader.state).toMatchObject({
    reading: false,
    source: "thread",
    conversation: { handle: before.conversation!.handle },
    items: before.items,
  });
  expect(notify).toHaveBeenCalledOnce();
  await reader.selectSource(cursor);
  expect(reader.state).toMatchObject({
    reading: false,
    source: cursor,
    error: undefined,
  });
  expect(reader.state.items.some((v) => v.tools?.length)).toBe(true);
  expect(notify).toHaveBeenCalledOnce();
  await reader.close();
  await catalog.close();
});

it("keeps the latest explicit selection and releases a stale late read", async () => {
  const { reader, catalog, native } = fixture();
  await reader.refresh();
  const first = (await catalog.openRead(owner.threadId))!,
    second = (await catalog.openRead(owner.threadId))!,
    pending = gate<CanonicalReadLease | null>();
  const close = vi.spyOn(native.port, "closeRead");
  vi.spyOn(catalog, "openRead")
    .mockReturnValueOnce(pending.promise)
    .mockResolvedValueOnce(second);
  const stale = reader.select(owner.threadId);
  await reader.select(owner.threadId);
  pending.resolve(first);
  await stale;
  expect(reader.state.conversation?.handle).toBe(second.read.handle);
  expect(close).toHaveBeenCalledWith(native.opened.handle, first.read.handle);
  await reader.close();
  await catalog.close();
  expect(close).toHaveBeenCalledTimes(2);
});

it("fences selection and drains an already-started read before close releases its own leases", async () => {
  const { reader, catalog, native } = fixture();
  await reader.refresh();
  await reader.select(owner.threadId);
  const late = (await catalog.openRead(owner.threadId))!,
    pending = gate<CanonicalReadLease | null>(),
    close = vi.spyOn(native.port, "closeRead");
  vi.spyOn(catalog, "openRead").mockReturnValueOnce(pending.promise);
  const reading = reader.select(owner.threadId),
    closing = reader.close();
  expect(close).not.toHaveBeenCalled();
  expect(() => reader.select(owner.threadId)).toThrow(/closed/);
  pending.resolve(late);
  await reading;
  await closing;
  expect(close).toHaveBeenCalledTimes(2);
  await catalog.close();
});

it("retains the prior pin and live rows when the replacement lacks a started worker", async () => {
  const { reader, catalog, notify, native } = fixture();
  await reader.refresh();
  await reader.selectRoute(owner, true);
  const before = reader.state;
  const accept = vi.fn();
  const close = vi.spyOn(native.port, "closeRead");
  await expect(
    reader.reconcile(owner, ["missing-worker-request"], accept),
  ).rejects.toThrow(/live view is retained/);
  expect(accept).not.toHaveBeenCalled();
  expect(reader.state.conversation?.handle).toBe(before.conversation?.handle);
  expect(reader.state.items).toEqual(before.items);
  expect(close).toHaveBeenCalledOnce();
  expect(notify).not.toHaveBeenCalled();
  await reader.close();
  await catalog.close();
});

it("validates capture on the new pin before atomically replacing live history", async () => {
  const native = nativeReaderPort("managed");
  const catalog = new CanonicalConversationCatalog(native.port, native.opened);
  const reader = new NativeConversationReader(catalog, vi.fn());
  await reader.refresh();
  await reader.selectRoute(owner, true);
  const before = reader.state.conversation!.handle;
  const accept = vi.fn(() =>
    expect(reader.state.conversation!.handle).toBe(before),
  );
  const request = [...reader.capturedRequests()][0]!;
  expect(request).toBeTruthy();
  await reader.reconcile(owner, [request], accept);
  expect(accept).toHaveBeenCalledOnce();
  expect(reader.state.conversation!.handle).not.toBe(before);
  await reader.close();
  await catalog.close();
});
