import { expect, it, vi } from "vitest";
import { NativeManagedAgents } from "../../../src/lib/native/ai/managed-agents.ts";
import { acpFixture } from "../../fixtures/ai/acp-transport.mjs";
import { owner, uuid } from "../../../catalog/support/ai/native/facts.ts";
import { deferred } from "../conversations/managed-turn-fixture.ts";

function fixture() {
  const acp = acpFixture();
  vi.spyOn(acp.backend.client, "targets").mockResolvedValue([
    { id: "codex", label: "Codex" },
  ]);
  const managed = new NativeManagedAgents(acp.backend);
  const prepared = {
    requestId: "a".repeat(32),
    conversation: {
      ...owner,
      target: { type: "conversation" as const, id: owner.target.id },
    },
    targetId: uuid(500),
  };
  return { acp, managed, prepared };
}

it("launches the exact prepared native target and preserves the human UUID with separate context", async () => {
  const { acp, managed, prepared } = fixture();
  const session = await managed.start(prepared, {
    agent: "codex",
    prompt: "",
    metadata: { targetId: "untrusted:other-target" },
  });
  const requestId = uuid(800);
  await session.send("One unchanged authored prompt", {
    requestId,
    contextBlocks: [
      {
        kind: "file-context",
        id: "note",
        content: "Reference only",
        metadata: { path: "Note.md" },
      },
    ],
  });
  expect(
    acp.calls.find((call: unknown[]) => call[0] === "open")[1].targetId,
  ).toBe(prepared.targetId);
  const prompt = acp.calls.find(
    (call: unknown[]) =>
      call[0] === "submit" && (call[3] as { type: string }).type === "prompt",
  );
  expect(prompt[2]).toBe(requestId);
  expect(prompt[3]).toMatchObject({
    text: "One unchanged authored prompt",
    context: expect.stringContaining("Reference only"),
  });
  await managed.close();
  expect(
    acp.calls.filter((call: unknown[]) => call[0] === "close"),
  ).toHaveLength(1);
});

it("rejects malformed prompt identities before preparing context or submitting", async () => {
  const { acp, managed, prepared } = fixture();
  const session = await managed.start(prepared, { agent: "codex", prompt: "" });
  const prepareContext = vi.fn(async () => []);
  for (const requestId of [
    "opaque:native-thread",
    "A".repeat(32),
    uuid(0xabc).toUpperCase(),
    "../request",
  ])
    await expect(
      session.send("Authored", { requestId, prepareContext }),
    ).rejects.toThrow(/invalid_authored_request_identity/);
  expect(prepareContext).not.toHaveBeenCalled();
  expect(
    acp.calls.filter(
      (call: unknown[]) =>
        call[0] === "submit" && (call[3] as { type: string }).type === "prompt",
    ),
  ).toHaveLength(0);
  await managed.close();
});

it("does not fall back to a raw client for unsupported managed requests", async () => {
  const { acp, managed, prepared } = fixture();
  await expect(
    managed.start(prepared, { agent: "cursor", prompt: "" }),
  ).rejects.toThrow(/cannot run/);
  await expect(
    managed.start(prepared, { agent: "codex", prompt: "", restricted: true }),
  ).rejects.toThrow(/cannot run/);
  await expect(
    managed.start(prepared, {
      agent: "codex",
      prompt: "",
      metadata: { runtime: "compute" },
    }),
  ).rejects.toThrow(/cannot run/);
  expect(
    acp.calls.filter((call: unknown[]) => call[0] === "open"),
  ).toHaveLength(0);
  await managed.close();
});

it("owns a startup racing service closure and closes its worker before returning", async () => {
  const { acp, managed, prepared } = fixture();
  const gate = deferred<void>();
  const open = acp.backend.client.open.bind(acp.backend.client);
  const opening = vi
    .spyOn(acp.backend.client, "open")
    .mockImplementation(async (...args) => {
      await gate.promise;
      return open(...args);
    });
  const starting = managed.start(prepared, { agent: "codex", prompt: "" });
  const rejected = expect(starting).rejects.toThrow(/closed/);
  await vi.waitFor(() => expect(opening).toHaveBeenCalledOnce());
  const closing = managed.close();
  gate.resolve();
  await rejected;
  await closing;
  expect(
    acp.calls.filter((call: unknown[]) => call[0] === "close"),
  ).toHaveLength(1);
});

it("retains failed session cleanup for an explicit service-close retry", async () => {
  const { acp, managed, prepared } = fixture();
  const open = acp.backend.client.open.bind(acp.backend.client);
  acp.backend.client.open = vi.fn(async (...args) => {
    const session = await open(...args);
    vi.spyOn(session, "close").mockRejectedValueOnce(
      new Error("Native close reply lost"),
    );
    return session;
  });
  await managed.start(prepared, { agent: "codex", prompt: "" });
  await expect(managed.close()).rejects.toThrow(/cleanup failed/);
  await managed.close();
  expect(
    acp.calls.filter((call: unknown[]) => call[0] === "close"),
  ).toHaveLength(1);
});

it("releases renderer streams after native Stop without closing the same worker twice", async () => {
  const { acp, managed, prepared } = fixture();
  const session = await managed.start(prepared, { agent: "codex", prompt: "" });
  // Native dispatch Stop owns the actual worker close. The transport fixture
  // retains its stream object so local detachment remains observable here.
  await managed.prepareStop(session);
  await managed.releaseStopped(session);
  await managed.close();
  expect(
    acp.calls.filter((call: unknown[]) => call[0] === "close"),
  ).toHaveLength(0);
  expect(
    acp.calls.filter((call: unknown[]) => call[0] === "detach"),
  ).toHaveLength(1);
});

it("closes an active worker before waiting for its pending prompt to settle", async () => {
  const { acp, managed, prepared } = fixture();
  const pending = deferred<void>();
  const prompted = vi.fn();
  acp.onPrompt = async () => {
    prompted();
    await pending.promise;
    throw new Error("The stopped prompt has an unknown outcome");
  };
  const session = await managed.start(prepared, { agent: "codex", prompt: "" });
  const sending = session.send("Stop this active turn", {
    requestId: uuid(801),
  });
  const failed = expect(sending).rejects.toBeInstanceOf(Error);
  await vi.waitFor(() => expect(prompted).toHaveBeenCalledOnce());
  const closing = managed.close();
  await vi.waitFor(() =>
    expect(
      acp.calls.filter((call: unknown[]) => call[0] === "close"),
    ).toHaveLength(1),
  );
  pending.resolve();
  await failed;
  await closing;
  await expect(session.send("Do not dispatch after close")).rejects.toThrow(
    /closed/,
  );
});
