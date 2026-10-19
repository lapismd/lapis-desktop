import { afterEach, expect, it, vi } from "vitest";
import { StreamingChatTrace } from "../../../../src/lib/ai/chat/controller/streaming-trace.ts";
import type { AiChatItem } from "../../../../src/lib/ai/chat/chat-items.ts";

afterEach(() => vi.useRealTimers());
function fixture() {
  let items: AiChatItem[] = [];
  let active = true;
  const publish = vi.fn((next: AiChatItem[]) => {
    items = next;
  });
  const trace = new StreamingChatTrace(
    () => items,
    publish,
    () => active,
  );
  return {
    trace,
    publish,
    items: () => items,
    retire: () => {
      active = false;
    },
  };
}

it("retains complete text while bounding Markdown presentation updates", () => {
  vi.useFakeTimers();
  const value = fixture();
  const text = Array.from({ length: 500 }, (_, index) => `${index + 1}\n`).join(
    "",
  );
  for (const character of text)
    value.trace.receive({ type: "text", text: character });
  vi.advanceTimersByTime(32);
  expect(value.items()).toHaveLength(1);
  expect(value.items()[0]).toMatchObject({
    type: "message",
    role: "assistant",
    text,
  });
  expect(value.publish.mock.calls.length).toBeLessThan(65);
});

it("flushes a sparse response on time and keeps tool/message boundaries ordered", () => {
  vi.useFakeTimers();
  const value = fixture();
  const receivedAt = new Date().toISOString();
  value.trace.receive({ type: "text", text: "First" });
  expect(value.items()).toEqual([]);
  vi.advanceTimersByTime(32);
  expect(value.items()[0]).toMatchObject({
    text: "First",
    createdAt: receivedAt,
  });
  value.trace.receive({ type: "text", text: " response" });
  value.trace.receive({
    type: "tool.start",
    id: "read",
    name: "read",
    input: "Note.md",
  });
  value.trace.receive({ type: "text", text: "After tool" });
  value.trace.receive({ type: "completed" });
  expect(value.items().map((item) => item.type)).toEqual([
    "message",
    "tool",
    "message",
  ]);
  expect(value.items()[0]).toMatchObject({ text: "First response" });
  expect(value.items()[2]).toMatchObject({ text: "After tool" });
});

it("flushes received thinking before an approval becomes visible", () => {
  const value = fixture();
  value.trace.receive({ type: "thinking", text: "Need a decision" });
  value.trace.receive({
    type: "permission.request",
    request: {
      id: "ask",
      kind: "read",
      origin: "runtime",
      options: [],
      title: "Read note?",
    },
  });
  expect(value.items().map((item) => item.type)).toEqual([
    "thinking",
    "approval",
  ]);
  value.trace.clear();
});

it("does not publish buffered fragments into a retired view", () => {
  vi.useFakeTimers();
  const value = fixture();
  value.trace.receive({ type: "text", text: "Old view" });
  value.retire();
  vi.advanceTimersByTime(32);
  expect(value.publish).not.toHaveBeenCalled();
  value.trace.receive({ type: "completed" });
  expect(value.publish).not.toHaveBeenCalled();
});

it("flushes oversized fragments directly without truncating content or retaining a timer", () => {
  vi.useFakeTimers();
  const value = fixture();
  value.trace.receive({ type: "text", text: "prefix" });
  const body = "x".repeat(20_000);
  value.trace.receive({ type: "text", text: body });
  expect(value.items()[0]).toMatchObject({ text: `prefix${body}` });
  expect(vi.getTimerCount()).toBe(0);
});
