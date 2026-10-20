import { expect, it, vi } from "vitest";
import { CanonicalConversationCatalog } from "../../../src/lib/ai/conversations/canonical-catalog.ts";
import type {
  CanonicalConversationPage,
  CanonicalConversationRead,
  CanonicalConversationSummary,
} from "../../../src/lib/ai/conversations/backend-port.ts";
import type { NativeRecordPage } from "../../../src/lib/ai/conversations/native-records.ts";

const opened = {
  handle: "11111111-1111-4111-8111-111111111111",
  selection: { backend: "jj" as const, revision: 1 },
};
const row = (id = "a"): CanonicalConversationSummary => ({
  threadId: id.repeat(32),
  repository: "f".repeat(32),
  target: { type: "conversation", id: `opaque ${id}` },
  title: `Conversation ${id}`,
  status: "idle",
  createdAtMillis: 1n,
  updatedAtMillis: 2n,
});
const page = (
  rows = [row()],
  nextCursor: string | null = null,
  selection = [1],
): CanonicalConversationPage => ({
  version: 1,
  repository: "f".repeat(32),
  selection,
  conversations: rows,
  nextCursor,
});
const read = (member = row()): CanonicalConversationRead => ({
  handle: "22222222-2222-4222-8222-222222222222",
  snapshot: "exact native snapshot",
  identity: {
    target: member.target,
    repository: member.repository,
    threadId: member.threadId,
  },
  selection: [1],
  recordSources: [],
  view: {
    identity: {
      target: member.target,
      repository: member.repository,
      threadId: member.threadId,
    },
    header: {
      reference: { kind: "thread_version", id: "a".repeat(64) },
      id: member.threadId,
      title: member.title,
      status: member.status,
      actor: "e".repeat(32),
      acceptedAtMillis: 1n,
      previous: null,
      event: { kind: "thread_event", id: "f".repeat(64) },
      raw: {},
    },
    metadata: null,
    messages: [],
    raw: {},
  },
});
const records = (): NativeRecordPage => ({
  source: "exact native records",
  origin: { version: 2, conversation: read().identity },
  selection: [1],
  cursor: "records cursor",
  sessionId: "e".repeat(32),
  afterIndex: 0,
  nextAfterIndex: null,
  records: [],
});
function gate<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { resolve, promise };
}
function fixture() {
  const port = {
    canonical: {
      list: vi.fn(async (_handle: string, _cursor?: string | null) => page()),
      openRead: vi.fn(
        async (
          _handle: string,
          _thread: string,
        ): Promise<CanonicalConversationRead | null> => read(),
      ),
    },
    readTranscript: vi.fn(
      async (_handle: string, _read: string, _cursor: string, _after: string) =>
        "exact native range",
    ),
    closeRead: vi.fn(async (_handle: string, _read: string) => {}),
    readRecords: vi.fn(
      async (_handle: string, _read: string, _cursor: string, _after: number) =>
        records(),
    ),
  };
  return { port, catalog: new CanonicalConversationCatalog(port, opened) };
}

it("keeps the last good page and requires refresh when a continuation changes selection", async () => {
  const { port, catalog } = fixture();
  port.canonical.list
    .mockResolvedValueOnce(page([row()], "next"))
    .mockResolvedValueOnce(page([row("b")], null, [2]));
  await catalog.refresh();
  await expect(catalog.loadMore()).rejects.toThrow(/changed/);
  expect(catalog.state).toMatchObject({ phase: "error", busy: false });
  expect(catalog.state.page?.conversations.map((r) => r.threadId)).toEqual([
    row().threadId,
  ]);
  expect(port.canonical.list.mock.calls.map(([, cursor]) => cursor)).toEqual([
    undefined,
    "next",
  ]);
  await catalog.close();
});

it("refuses duplicate native target membership across pages", async () => {
  const { port, catalog } = fixture();
  port.canonical.list
    .mockResolvedValueOnce(page([row()], "next"))
    .mockResolvedValueOnce(page([{ ...row("b"), target: row().target }]));
  await catalog.refresh();
  await expect(catalog.loadMore()).rejects.toThrow(/conflicting membership/);
  expect(catalog.state.page?.conversations).toHaveLength(1);
  await catalog.close();
});

it("ignores a late discovery page after a newer refresh has completed", async () => {
  const { port, catalog } = fixture(),
    pending = gate<CanonicalConversationPage>();
  port.canonical.list
    .mockReturnValueOnce(pending.promise)
    .mockResolvedValueOnce(page([row("b")]));
  const first = catalog.refresh();
  await catalog.refresh();
  pending.resolve(page());
  await first;
  expect(catalog.state.page?.conversations).toEqual([row("b")]);
  await catalog.close();
});

it("retains an opened pin while current catalog selection advances", async () => {
  const { port, catalog } = fixture();
  await catalog.refresh();
  const lease = (await catalog.openRead(row().threadId))!;
  port.canonical.list.mockResolvedValueOnce(page([row("b")], null, [2]));
  await catalog.refresh();
  expect(await lease.range("original cursor", "18446744073709551615")).toBe(
    "exact native range",
  );
  expect(port.readTranscript).toHaveBeenCalledWith(
    opened.handle,
    read().handle,
    "original cursor",
    "18446744073709551615",
  );
  expect(port.closeRead).not.toHaveBeenCalled();
  await lease.close();
  await catalog.close();
  expect(port.closeRead).toHaveBeenCalledOnce();
});

it("fences and drains a lease's in-flight ranges before closing its read", async () => {
  const { port, catalog } = fixture(),
    pending = gate<string>();
  await catalog.refresh();
  const lease = (await catalog.openRead(row().threadId))!;
  port.readTranscript.mockReturnValueOnce(pending.promise);
  const range = lease.range("cursor", "1");
  const closing = lease.close();
  expect(port.closeRead).not.toHaveBeenCalled();
  await expect(lease.range("cursor", "1")).rejects.toThrow(/closed/);
  pending.resolve("original result");
  expect(await range).toBe("original result");
  await closing;
  await catalog.close();
  expect(port.closeRead).toHaveBeenCalledOnce();
});

it("fences and drains typed record work before releasing the retained read", async () => {
  const { port, catalog } = fixture(),
    pending = gate<NativeRecordPage>();
  await catalog.refresh();
  const lease = (await catalog.openRead(row().threadId))!;
  port.readRecords.mockReturnValueOnce(pending.promise);
  const loading = lease.records("records cursor", 0),
    closing = lease.close();
  expect(port.closeRead).not.toHaveBeenCalled();
  await expect(lease.records("records cursor", 0)).rejects.toThrow(/closed/);
  pending.resolve(records());
  expect(await loading).toEqual(records());
  await closing;
  expect(port.readRecords).toHaveBeenCalledWith(
    opened.handle,
    read().handle,
    "records cursor",
    0,
  );
  expect(port.closeRead).toHaveBeenCalledOnce();
  await catalog.close();
});

it("refuses record pages that substitute their original pin identity or selection", async () => {
  const { port, catalog } = fixture();
  await catalog.refresh();
  const lease = (await catalog.openRead(row().threadId))!;
  for (const page of [
    { ...records(), selection: [2] },
    {
      ...records(),
      origin: { version: 1 as const, requestId: "f".repeat(32) },
    },
    {
      ...records(),
      origin: { version: 2 as const, conversation: read(row("b")).identity },
    },
  ]) {
    port.readRecords.mockResolvedValueOnce(page);
    await expect(lease.records("records cursor", 0)).rejects.toThrow(
      /retained identity/,
    );
  }
  await lease.close();
  await catalog.close();
});

it("retains failed read cleanup for an exact idempotent retry", async () => {
  const { port, catalog } = fixture();
  await catalog.refresh();
  const lease = (await catalog.openRead(row().threadId))!;
  port.closeRead.mockRejectedValueOnce(new Error("temporary cleanup failure"));
  await expect(lease.close()).rejects.toThrow(/temporary/);
  await expect(lease.range("cursor", "1")).rejects.toThrow(/closed/);
  await lease.close();
  await catalog.close();
  expect(port.closeRead).toHaveBeenCalledTimes(2);
  expect(port.closeRead.mock.calls).toEqual([
    [opened.handle, read().handle],
    [opened.handle, read().handle],
  ]);
});

it("drains a read arriving after view closure and never publishes it to the caller", async () => {
  const { port, catalog } = fixture(),
    pending = gate<CanonicalConversationRead | null>();
  await catalog.refresh();
  port.canonical.openRead.mockReturnValueOnce(pending.promise);
  const reading = catalog.openRead(row().threadId);
  const closing = catalog.close();
  pending.resolve(read());
  await expect(reading).rejects.toThrow(/closed/);
  await closing;
  expect(port.closeRead).toHaveBeenCalledWith(opened.handle, read().handle);
  expect(catalog.state.phase).toBe("closed");
});

it("releases a changed identity and refuses unlisted native threads", async () => {
  const { port, catalog } = fixture();
  await catalog.refresh();
  port.canonical.openRead.mockResolvedValueOnce(
    read({ ...row(), target: { type: "recorded", session: "b".repeat(32) } }),
  );
  await expect(catalog.openRead(row().threadId)).rejects.toThrow(
    /identity changed/,
  );
  expect(port.closeRead).toHaveBeenCalledOnce();
  await expect(catalog.openRead(row("c").threadId)).rejects.toThrow(
    /current catalog/,
  );
  expect(port.canonical.openRead).toHaveBeenCalledTimes(1);
  await catalog.close();
});
