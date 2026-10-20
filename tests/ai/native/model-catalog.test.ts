import { describe, expect, it, vi } from "vitest";
import type { AcpTransport } from "@lapismd/ai";
import { NativeAiModels } from "../../../src/lib/native/ai/model-catalog.ts";
function fixture(
  session: unknown = {
    models: {
      currentModelId: "two",
      availableModels: [
        { modelId: "one", name: "First" },
        { modelId: "two", name: "Second", description: "Current model" },
      ],
    },
  },
) {
  const raw = {
    targets: vi.fn(async () => [{ id: "codex", label: "Codex" }]),
    open: vi.fn(async (options) => ({
      sessionId: "probe",
      requestId: options.requestId,
      targetId: options.targetId,
      facts: { session },
    })),
    close: vi.fn(async () => {}),
    list: vi.fn(async () => []),
  };
  const catalog = new NativeAiModels(raw as unknown as AcpTransport);
  return { raw, catalog };
}
describe("native ACP model catalog", () => {
  it("projects advertised provider models and closes the non-prompting probe", async () => {
    const f = fixture();
    expect(await f.catalog.listModels("codex", "acp")).toEqual([
      {
        provider: "codex",
        model: "one",
        displayName: "First",
        isDefault: false,
      },
      {
        provider: "codex",
        model: "two",
        displayName: "Second",
        description: "Current model",
        isDefault: true,
      },
    ]);
    expect(f.raw.close).toHaveBeenCalledWith("probe");
    expect(f.raw.open.mock.calls[0]![0]).toMatchObject({ targetId: "codex" });
    await f.catalog.close();
  });
  it("deduplicates concurrent catalogs without retaining stale cached inventory", async () => {
    const f = fixture();
    await Promise.all([
      f.catalog.listModels("codex"),
      f.catalog.listModels("codex"),
    ]);
    expect(f.raw.open).toHaveBeenCalledTimes(1);
    await f.catalog.listModels("codex");
    expect(f.raw.open).toHaveBeenCalledTimes(2);
    await f.catalog.close();
  });
  it("does not probe unavailable providers or deferred runtimes", async () => {
    const f = fixture();
    expect(await f.catalog.listModels("cursor")).toEqual([]);
    await expect(f.catalog.listModels("codex", "codex-native")).rejects.toThrow(
      /unavailable/,
    );
    expect(f.raw.open).not.toHaveBeenCalled();
    await f.catalog.close();
  });
  it("rejects malformed inventories while still releasing their probe", async () => {
    for (const availableModels of [
      [{ modelId: "", name: "bad" }],
      [{ modelId: "same" }, { modelId: "same" }],
      Array.from({ length: 513 }, (_, i) => ({ modelId: String(i) })),
    ]) {
      const f = fixture({ models: { availableModels } });
      await expect(f.catalog.listModels("codex")).rejects.toThrow(/catalog/);
      expect(f.raw.close).toHaveBeenCalledWith("probe");
      await f.catalog.close();
    }
  });
  it("drains pending opens and retries failed probe cleanup before its owner releases authority", async () => {
    const f = fixture();
    let release!: (value: Awaited<ReturnType<typeof f.raw.open>>) => void;
    f.raw.open.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const reading = f.catalog.listModels("codex");
    await vi.waitFor(() => expect(f.raw.open).toHaveBeenCalledTimes(1));
    const closing = f.catalog.close();
    let closed = false;
    void closing.then(() => {
      closed = true;
    });
    await Promise.resolve();
    expect(closed).toBe(false);
    release({
      sessionId: "probe",
      requestId: "probe",
      targetId: "codex",
      facts: { session: {} },
    });
    await reading;
    await closing;
    expect(f.raw.close).toHaveBeenCalledWith("probe");
    await expect(f.catalog.listModels("codex")).rejects.toThrow(/closed/);
  });
  it("retains failed cleanup for an explicit retry", async () => {
    const f = fixture();
    f.raw.close.mockRejectedValueOnce(new Error("cleanup failed"));
    await expect(f.catalog.listModels("codex")).rejects.toThrow(/cleanup/);
    await f.catalog.close();
    expect(f.raw.close).toHaveBeenCalledTimes(2);
  });
  it("locates and closes a lost open reply without replaying the probe", async () => {
    const f = fixture();
    f.raw.open.mockImplementationOnce(async (options) => {
      f.raw.list.mockResolvedValueOnce([
        {
          sessionId: "lost",
          requestId: options.requestId,
          targetId: "codex",
          facts: {},
        },
      ] as never);
      throw new Error("lost open reply");
    });
    await expect(f.catalog.listModels("codex")).rejects.toThrow(
      "lost open reply",
    );
    expect(f.raw.close).toHaveBeenCalledWith("lost");
    expect(f.raw.open).toHaveBeenCalledTimes(1);
    await f.catalog.close();
  });
});

it("discovers provider execution modes through the same non-prompting probe and cleanup", async () => {
  const f = fixture({
    configOptions: [
      {
        id: "mode",
        category: "mode",
        options: [{ value: "ask", name: "Ask before tools" }],
      },
    ],
    modes: {
      availableModes: [{ id: "ask", description: "Review every action" }],
    },
  });
  const [modes] = await Promise.all([
    f.catalog.listExecutionModes("codex"),
    f.catalog.listModels("codex"),
  ]);
  expect(modes).toEqual([
    { id: "ask", name: "Ask before tools", description: "Review every action" },
  ]);
  expect(f.raw.open).toHaveBeenCalledTimes(1);
  expect(f.raw.close).toHaveBeenCalledWith("probe");
  await f.catalog.close();
});
