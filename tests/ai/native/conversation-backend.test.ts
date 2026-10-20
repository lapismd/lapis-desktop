import { describe, expect, it, vi } from "vitest";
import { NativeConversationBackend } from "../../../src/lib/native/ai/backends/client.ts";
import { AdmittedAiTransport } from "../../../src/lib/native/ai/admitted-transport.ts";

const request = "01".repeat(16);
const handle = "31415926-5358-4979-9323-846264338327";
const reply = (type: string, data: unknown) =>
  JSON.stringify({ version: 1, data: { type, data } });

describe("native conversation boundary", () => {
  it("marks only native cleanup calls for retained admission after plugin disable", async () => {
    let enabled = true;
    const release = vi.fn(async () => {});
    const create = vi.fn();
    const scope = new AdmittedAiTransport({
      create,
      activate: async () => {},
      release,
      allowed: () => enabled,
    });
    const calls: string[] = [];
    const backend = new NativeConversationBackend("vault", (text, cleanup) =>
      scope.withAdmission(async () => {
        const operation = JSON.parse(text).operation;
        calls.push(operation.type);
        return operation.type === "read"
          ? reply("selection", { backend: "jj", revision: 1 })
          : reply("closed", undefined);
      }, cleanup),
    );
    await backend.selection();
    enabled = false;
    await expect(backend.canonical.list(handle)).rejects.toThrow(/disabled/);
    await backend.closeRead(handle, handle);
    await backend.close(handle);
    expect(calls).toEqual(["read", "closeConversationRead", "close"]);
    expect(create).not.toHaveBeenCalled();
    await scope.dispose(false);
    expect(release).toHaveBeenCalledOnce();
  });
  it("retains an unconfirmed preparation and reads its original proof without re-creating it", async () => {
    const proof = '{"metadata_sequence":18446744073709551615}';
    const conversation = {
      requestId: request,
      conversationId: handle,
      threadId: "ab".repeat(16),
      repository: null,
      receipt: null as string | null,
    };
    const call = vi
      .fn()
      .mockResolvedValueOnce(reply("conversation", conversation))
      .mockResolvedValueOnce(
        reply("conversation", { ...conversation, receipt: proof }),
      )
      .mockResolvedValueOnce(
        JSON.stringify({ version: 1, data: { type: "closed" } }),
      );
    const backend = new NativeConversationBackend("vault-session", call);
    expect(
      (await backend.prepare(handle, request, "Review a note")).receipt,
    ).toBeNull();
    expect((await backend.preparationStatus(handle, request))?.receipt).toBe(
      proof,
    );
    await backend.closeRead(handle, handle);
    expect(
      call.mock.calls.map(([text]) => JSON.parse(text).operation.type),
    ).toEqual([
      "prepareConversation",
      "conversationStatus",
      "closeConversationRead",
    ]);
  });

  it("rejects unrelated replies and bounds UTF-8 input before making any native call", async () => {
    const call = vi.fn(async () =>
      reply("opened", { handle, selection: { backend: "jj", revision: 1 } }),
    );
    const backend = new NativeConversationBackend("vault-session", call);
    await expect(backend.selection()).rejects.toThrow(/Invalid/);
    await expect(
      backend.prepare(handle, request, "😀".repeat(257)),
    ).rejects.toThrow(/Invalid/);
    await expect(
      backend.prepare(handle, request, "Title\nAnother line"),
    ).rejects.toThrow(/Invalid/);
    await expect(
      new NativeConversationBackend("😀".repeat(33), call).selection(),
    ).rejects.toThrow(/Invalid/);
    expect(call).toHaveBeenCalledTimes(1);
  });

  it("keeps transcript integer tokens intact and sends decimal continuation text", async () => {
    const snapshot = '{"sequence":18446744073709551615}';
    const call = vi.fn(async (operation: Record<string, unknown>) =>
      operation.type === "openConversationRead"
        ? reply("conversationRead", { handle, snapshot })
        : reply("transcriptRange", snapshot),
    );
    const backend = new NativeConversationBackend(
      "vault-session",
      async (text) => call(JSON.parse(text).operation),
    );
    expect(await backend.openRead(handle, request)).toEqual({
      handle,
      snapshot,
    });
    expect(
      await backend.readTranscript(
        handle,
        handle,
        handle,
        "18446744073709551615",
      ),
    ).toBe(snapshot);
    expect(call.mock.calls[1]?.[0].afterSequence).toBe("18446744073709551615");
    await expect(
      backend.readTranscript(handle, handle, handle, "18446744073709551616"),
    ).rejects.toThrow();
    expect(call).toHaveBeenCalledTimes(2);
  });

  it("never resubmits an uncertain selection and validates recovered receipt identity", async () => {
    const call = vi
      .fn()
      .mockRejectedValueOnce(new Error("response lost"))
      .mockResolvedValueOnce(reply("receipt", null))
      .mockResolvedValueOnce(
        reply("receipt", {
          request_id: "02".repeat(16),
          expected_revision: 0,
          selection: { backend: "jj", revision: 1 },
        }),
      );
    const backend = new NativeConversationBackend("vault-session", call);
    await expect(backend.select(request, 0, "jj")).rejects.toThrow(
      "response lost",
    );
    expect(call).toHaveBeenCalledTimes(1);
    expect(await backend.selectionStatus(request)).toBeNull();
    await expect(backend.selectionStatus(request)).rejects.toThrow(/Invalid/);
    expect(
      call.mock.calls.map(([text]) => JSON.parse(text).operation.type),
    ).toEqual(["select", "status", "status"]);
  });

  it("shares admission and drains native work without constructing an ACP transport", async () => {
    let finish!: (text: string) => void;
    let started!: () => void;
    const entered = new Promise<void>((resolve) => {
      started = resolve;
    });
    const pending = new Promise<string>((resolve) => {
      finish = resolve;
    });
    const release = vi.fn(async () => {});
    const create = vi.fn(() => {
      throw new Error("No ACP worker needed");
    });
    const scope = new AdmittedAiTransport({
      activate: async () => {},
      release,
      create,
      allowed: () => true,
    });
    const backend = new NativeConversationBackend("vault-session", () =>
      scope.withAdmission(() => {
        started();
        return pending;
      }),
    );
    const reading = backend.selection();
    await entered;
    scope.fence();
    const closing = scope.dispose(false);
    expect(release).not.toHaveBeenCalled();
    finish(reply("selection", { backend: "vault-files", revision: 0 }));
    await reading;
    await closing;
    expect(release).toHaveBeenCalledOnce();
    expect(create).not.toHaveBeenCalled();
    await expect(backend.selection()).rejects.toThrow(/closed/);
  });
});
