import { expect, it } from "vitest";
import { nativeData } from "../../../catalog/support/ai/native/data.ts";
import { id, owner } from "../../../catalog/support/ai/native/facts.ts";
import { conversationView } from "../../../src/lib/native/ai/backends/view.ts";
import { parseNativeConversationJson } from "../../../src/lib/native/ai/backends/json.ts";
import { nativeConversationTitle } from "../../../src/lib/ai/conversations/native-view.ts";

const source = () =>
  parseNativeConversationJson(nativeData().snapshot) as Record<string, unknown>;
const identity = {
  ...owner,
  target: { type: "conversation" as const, id: owner.target.id },
};
it("keeps native source references, human actors, metadata and full-width generated time", () => {
  const raw = source(),
    view = conversationView(raw, identity);
  expect(view.metadata?.generated?.generatedAtMillis).toBe(
    9223372036854775807n,
  );
  expect(view.metadata?.generated).toMatchObject({
    summary: "A local review of the remaining migration work.",
    keywords: ["migration", "recovery"],
    goals: ["Keep saved work recoverable"],
    provider: "catalog",
    model: "fake-model",
    promptVersion: 1,
    truncated: false,
  });
  expect(view.metadata?.reference.kind).toBe("conversation_metadata");
  expect(view.header.reference.kind).toBe("thread_version");
  expect(view.messages[0]).toMatchObject({
    reference: { kind: "human_message_revision" },
    id: id(3),
    actor: id(9),
    threadId: owner.threadId,
  });
  expect(view.raw).toBe(raw);
  expect(nativeConversationTitle(view)).toBe(
    "Review yesterday's project notes",
  );
});

it("retains source fields outside the presentation index without inventing bindings", () => {
  const raw = source();
  raw.original_extension = { counter: 18446744073709551615n };
  const view = conversationView(raw, identity);
  expect(view.raw.original_extension).toEqual({
    counter: 18446744073709551615n,
  });
  expect(view.messages[0]!.raw).toHaveProperty("previous", null);
  expect(view).not.toHaveProperty("nativeSessionId");
});

it("refuses a mismatched source, wrong reference kind, extra message reference or malformed metadata", () => {
  const invalid: [string[], unknown][] = [
    [["thread", "thread_id"], id(99)],
    [["thread", "purpose", "target", "id"], "different opaque source"],
    [["references", "thread", "kind"], "thread_event"],
    [["references", "messages", id(3), "kind"], "thread_link"],
    [
      ["references", "messages", id(99)],
      { kind: "human_message_revision", id: "c".repeat(64) },
    ],
    [["messages", "0", "actor"], "local-user"],
    [["messages", "0", "body"], null],
    [["metadata", "thread_id"], id(99)],
    [["metadata", "value", "generated", "sources"], []],
    [["metadata", "value", "generated", "summary"], "  "],
  ];
  for (const [path, replacement] of invalid) {
    const value = source();
    let cursor: Record<string, unknown> = value;
    for (const segment of path.slice(0, -1))
      cursor = cursor[segment] as Record<string, unknown>;
    cursor[path.at(-1)!] = replacement;
    expect(() => conversationView(value, identity)).toThrow(/Invalid/);
  }
});
