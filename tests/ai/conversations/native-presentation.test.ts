import { expect, it } from "vitest";
import { CanonicalConversationCatalog } from "../../../src/lib/ai/conversations/canonical-catalog.ts";
import { NativeSessionRecords } from "../../../src/lib/ai/conversations/native-session-records.ts";
import { nativeMessageContent } from "../../../src/lib/ai/conversations/native-message-content.ts";
import { projectNativeSession } from "../../../src/lib/ai/chat/native-session-projection.ts";
import { projectNativeThread } from "../../../src/lib/ai/chat/native-thread-projection.ts";
import { nativeReaderPort } from "../../../catalog/support/ai/native/port.ts";
import { owner, id } from "../../../catalog/support/ai/native/facts.ts";

it("uses typed message/tool facts, retains original IDs/revisions and excludes foreign-session events", async () => {
  const native = nativeReaderPort("captured"),
    catalog = new CanonicalConversationCatalog(native.port, native.opened);
  await catalog.refresh();
  const lease = (await catalog.openRead(owner.threadId))!,
    source = lease.read.recordSources[0]!,
    records = new NativeSessionRecords(lease, source.cursor);
  expect(() => projectNativeSession(records)).toThrow(/closure/);
  await records.loadAll();
  const items = projectNativeSession(records),
    capturedUser = items.find((v) => v.role === "user")!;
  expect(
    items
      .flatMap((v) => v.blocks)
      .map((b) => b.text)
      .join("\n"),
  ).not.toContain("Foreign session message");
  expect(capturedUser.id).toContain(id(101));
  expect(capturedUser.blocks[0]!.revision).toBe(
    (70).toString(16).padStart(64, "0"),
  );
  expect(capturedUser.turn?.id).toBe(capturedUser.id);
  const tools = items.flatMap((item) => item.tools ?? []);
  expect(tools[0]).toMatchObject({
    title: "read_note",
    status: "complete",
    commentable: false,
  });
  expect(tools[1]).toMatchObject({
    title: "collect_follow_up · running",
    status: "unknown",
    commentable: false,
  });
  expect(tools[0]!.blocks.map((b) => b.text)).toEqual([
    '{"path":"Notes/Projects/desktop-migration.md"}',
    "# Desktop migration\n\n- [x] Local history\n- [ ] Native chat recovery\n",
  ]);
  expect(
    items.find((v) => v.label === "Recorded permission: requested"),
  ).toMatchObject({ kind: "context" });
  expect(items.find((v) => v.notice === "warning")?.label).toBe(
    "Capture gap: 11–13",
  );
  expect(records.source.coverage.completeness).toBe("partial");
  expect(
    items.every((v) => v.blocks.every((b) => b.commentable === false)),
  ).toBe(true);
  await lease.close();
  await catalog.close();
});

it("keeps authored and captured messages distinct even when their text matches", async () => {
  const native = nativeReaderPort("authored"),
    catalog = new CanonicalConversationCatalog(native.port, native.opened);
  await catalog.refresh();
  const lease = (await catalog.openRead(owner.threadId))!,
    records = new NativeSessionRecords(
      lease,
      lease.read.recordSources[0]!.cursor,
    );
  await records.loadAll();
  const authored = projectNativeThread(lease.read.view)[0]!,
    captured = projectNativeSession(records).find((v) => v.role === "user")!;
  expect(authored.blocks[0]!.text).toBe(captured.blocks[0]!.text);
  expect(authored.id).not.toBe(captured.id);
  expect(authored.author?.id).toBe(id(9));
  expect(authored.author?.name).not.toBe("You");
  expect(authored.blocks[0]!.revision).toBe(
    lease.read.view.messages[0]!.reference.id,
  );
  const wide = structuredClone(lease.read.view);
  wide.messages[0]!.acceptedAtMillis = 9223372036854775807n;
  expect(projectNativeThread(wide)[0]).toMatchObject({
    createdAt: undefined,
    timestamp: "9223372036854775807 ms",
  });
  await lease.close();
  await catalog.close();
});

it("adapts only known message content schemas while preserving exact raw context and unknown JSON", () => {
  const text =
    '{"schema":"jj-store.sent-context.v1","text":"Authored question","context":{"version":1,"counter":18446744073709551615}}';
  const content = nativeMessageContent(
    { media_type: "json", text },
    "owned_controller",
  );
  expect(content.text).toBe("Authored question");
  expect(content.sentContext).toMatchObject({
    rawContent: text,
    rawLanguage: "json",
    delivery: "unknown",
  });
  expect(nativeMessageContent({ media_type: "json", text }, "codex")).toEqual({
    text,
    kind: "code",
  });
  const unknown = '{"type":"activity","sequence":18446744073709551615}';
  expect(
    nativeMessageContent(
      { media_type: "json", text: unknown },
      "owned_controller",
    ),
  ).toEqual({ text: unknown, kind: "code" });
  expect(
    nativeMessageContent(
      {
        media_type: "json",
        text: '[{"type":"text","text":"one"},{"type":"text","text":"two"}]',
      },
      "open_code",
    ),
  ).toEqual({ text: "one\n\ntwo", kind: "markdown" });
});
