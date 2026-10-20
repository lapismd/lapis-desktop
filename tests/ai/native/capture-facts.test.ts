import { expect, it, vi } from "vitest";
import { captureFacts } from "../../../src/lib/native/ai/backends/capture-facts.ts";
import { NativeConversationBackend } from "../../../src/lib/native/ai/backends/client.ts";
import { recordPage } from "../../../src/lib/native/ai/backends/record-pages.ts";
import { managedNativeData } from "../../../catalog/support/ai/native/managed-data.ts";
import { nativeData } from "../../../catalog/support/ai/native/data.ts";
import { owner, uuid } from "../../../catalog/support/ai/native/facts.ts";

const sample = () => {
  const text = [...managedNativeData(nativeData()).pages.values()][0]!;
  const page = JSON.parse(text);
  return {
    text,
    page,
    facts: page.records.find(
      (r: { projection: { type: string } }) =>
        r.projection.type === "observation_batch",
    ).projection.value.desktop,
  };
};
it("decodes only typed native attribution and keeps requested preferences separate from observed configuration", () => {
  const { facts } = sample();
  expect(captureFacts(facts)).toEqual(facts);
  expect(captureFacts(facts).participant?.preferredModel).toBe("gpt-5.6-sol");
  expect(captureFacts(facts)).not.toHaveProperty("observedModel");
  for (const value of [
    { ...facts, schema: 2 },
    { ...facts, clientId: "arbitrary-agent" },
    { ...facts, authored: { ...facts.authored, requestId: "f".repeat(32) } },
    {
      ...facts,
      authored: {
        ...facts.authored,
        revision: { ...facts.authored.revision, kind: "thread_version" },
      },
    },
    {
      ...facts,
      participant: { ...facts.participant, avatar: "file:///private/secret" },
    },
  ])
    expect(() => captureFacts(value)).toThrow("Invalid native");
});
it("refuses host facts outside the original canonical record origin", () => {
  const { page } = sample();
  const record = page.records.find(
    (r: { projection: { type: string } }) =>
      r.projection.type === "observation_batch",
  );
  record.projection.value.desktop.threadId = "f".repeat(32);
  expect(() => recordPage(JSON.stringify(page), page.cursor, 0)).toThrow(
    "Invalid native",
  );
});
it("sends only bounded participant preferences and cannot pass avatar or executable authority", async () => {
  const { facts } = sample();
  const invoke = vi.fn(async (_request: string) =>
    JSON.stringify({
      version: 1,
      data: {
        type: "canonicalCapture",
        data: {
          requestId: "a".repeat(32),
          conversation: owner,
          targetId: uuid(77),
        },
      },
    }),
  );
  const client = new NativeConversationBackend("vault", invoke);
  const input = {
    requestId: "a".repeat(32),
    conversation: owner,
    expectedSelection: [1],
    clientId: "codex" as const,
    participant: facts.participant,
  };
  await client.managed.prepareCanonical(uuid(1), input);
  expect(JSON.parse(invoke.mock.calls[0]![0]).operation.participant).toEqual(
    facts.participant,
  );
  await expect(
    client.managed.prepareCanonical(uuid(1), {
      ...input,
      participant: { ...input.participant, executable: "outside" },
    }),
  ).rejects.toThrow("Invalid native");
  expect(invoke).toHaveBeenCalledTimes(1);
});
