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
  options: ConstructorParameters<typeof NativeAiModels>[1] = {},
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
  const catalog = new NativeAiModels(raw as unknown as AcpTransport, options);
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
  it("shares successful discovery across callers until explicitly invalidated", async () => {
    const f = fixture();
    await Promise.all([
      f.catalog.listModels("codex"),
      f.catalog.listModels("codex"),
    ]);
    expect(f.raw.open).toHaveBeenCalledTimes(1);
    await f.catalog.listModels("codex");
    expect(f.raw.open).toHaveBeenCalledTimes(1);
    await f.catalog.listExecutionModes("codex");
    expect(f.raw.open).toHaveBeenCalledTimes(1);
    f.catalog.invalidate();
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
  it("expires successful metadata after five minutes and returns independent projections", async () => {
    let now = 0;
    const f = fixture(undefined, { now: () => now });
    const first = await f.catalog.listModels("codex");
    first[0]!.model = "consumer mutation";
    now = 299_999;
    expect((await f.catalog.listModels("codex"))[0]!.model).toBe("one");
    expect(f.raw.open).toHaveBeenCalledTimes(1);
    now = 300_000;
    await Promise.all([
      f.catalog.listModels("codex"),
      f.catalog.listExecutionModes("codex"),
    ]);
    expect(f.raw.open).toHaveBeenCalledTimes(2);
    await f.catalog.close();
  });
  it("does not cache failed discovery or bypass revoked workspace trust", async () => {
    let available = true;
    const f = fixture(undefined, { available: () => available });
    f.raw.open.mockRejectedValueOnce(new Error("discovery failed"));
    await expect(f.catalog.listModels("codex")).rejects.toThrow(
      "discovery failed",
    );
    await f.catalog.listModels("codex");
    expect(f.raw.open).toHaveBeenCalledTimes(2);
    available = false;
    await expect(f.catalog.listModels("codex")).rejects.toThrow(/disabled/);
    expect(f.raw.open).toHaveBeenCalledTimes(2);
    available = true;
    await f.catalog.listModels("codex");
    expect(f.raw.open).toHaveBeenCalledTimes(3);
    await f.catalog.close();
  });
  it("rejects invalidated in-flight facts without losing their cleanup owner", async () => {
    const f = fixture();
    let release!: (value: Awaited<ReturnType<typeof f.raw.open>>) => void;
    f.raw.open.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const reading = f.catalog.listModels("codex");
    const refused = expect(reading).rejects.toThrow(/discovery changed/);
    await vi.waitFor(() => expect(f.raw.open).toHaveBeenCalledOnce());
    f.catalog.invalidate();
    release({
      sessionId: "probe",
      requestId: "probe",
      targetId: "codex",
      facts: { session: {} },
    });
    await refused;
    await f.catalog.listModels("codex");
    expect(f.raw.open).toHaveBeenCalledTimes(2);
    await f.catalog.close();
    expect(f.raw.close).toHaveBeenCalledTimes(2);
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
