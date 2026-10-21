import { describe, expect, it, vi } from "vitest";
import { AiModelOptions } from "../../../src/lib/ai/settings/model-options.ts";
import { AiSettingsStore } from "../../../src/lib/ai/settings/settings-store.ts";
import { memorySettingFields } from "../../../src/lib/ai/settings/memory-setting-fields.ts";

function fixture() {
  const save = vi.fn(async () => {});
  const store = new AiSettingsStore(save);
  const listModels = vi.fn(async (provider: string) => [
    { provider, model: `${provider}-model`, displayName: `${provider} model` },
    { provider: "opencode", model: "foreign" },
  ]);
  const report = vi.fn();
  return {
    store,
    save,
    listModels,
    report,
    options: new AiModelOptions(store, { listModels }, report),
  };
}

describe("processor model settings", () => {
  it("uses separate model sources for memory and handoff", () => {
    const f = fixture();
    const fields = memorySettingFields(f.store.get());
    expect(
      fields.find((field) => field.id === "ai.memoryConsolidationModel"),
    ).toMatchObject({
      optionsSource: "ai.processorModels.memory",
      allowUnknownOptions: false,
    });
    expect(
      fields.find((field) => field.id === "ai.handoffSummaryModel"),
    ).toMatchObject({
      optionsSource: "ai.processorModels.handoff",
      allowUnknownOptions: false,
    });
  });

  it("discovers each processor's agent independently of chat and never changes saved models", async () => {
    const f = fixture();
    await f.store.update({
      acpAgent: "opencode",
      handoffSummaryAgent: "cursor",
    });
    f.save.mockClear();
    expect(await f.options.loadProcessor("memory")).toContainEqual(
      expect.objectContaining({ value: "local-model" }),
    );
    expect(await f.options.loadProcessor("handoff")).toContainEqual(
      expect.objectContaining({ value: "cursor-model" }),
    );
    expect(f.listModels.mock.calls).toEqual([
      ["local", "acp"],
      ["cursor", "acp"],
    ]);
    expect(f.save).not.toHaveBeenCalled();
    expect(f.store.get().memoryConsolidationModel).toBe("gpt-5.6-sol");
  });

  it("updates the selected agent's catalog and rejects cross-provider results", async () => {
    const f = fixture();
    await f.options.loadProcessor("handoff");
    await f.store.update({ handoffSummaryAgent: "local" });
    const choices = await f.options.loadProcessor("handoff");
    expect(choices.map((option) => option.value)).toEqual([
      "gpt-5.6-sol",
      "local-model",
    ]);
    expect(f.listModels).toHaveBeenLastCalledWith("local", "acp");
  });

  it("retains the latest saved choice and reports discovery failure", async () => {
    const f = fixture();
    f.listModels.mockImplementation(async () => {
      await f.store.update({ memoryConsolidationModel: "saved-choice" });
      throw new Error("Catalog unavailable");
    });
    expect(await f.options.loadProcessor("memory")).toEqual([
      expect.objectContaining({
        value: "saved-choice",
        description: expect.stringContaining("Catalog unavailable"),
      }),
    ]);
    expect(f.report).toHaveBeenCalledOnce();
  });

  it("leaves historical unsupported runtimes inert", async () => {
    const f = fixture();
    await f.store.update({ handoffSummaryRuntime: "codex-native" });
    expect(await f.options.loadProcessor("handoff")).toEqual([
      expect.objectContaining({
        value: "gpt-5.6-sol",
        description: expect.stringContaining("unavailable"),
      }),
    ]);
    expect(f.listModels).not.toHaveBeenCalled();
  });

  it("fences agent changes and disposed requests", async () => {
    const f = fixture();
    let release!: () => void;
    f.listModels.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () => resolve([{ provider: "codex", model: "late" }]);
        }),
    );
    const old = f.options.loadProcessor("handoff");
    await f.store.update({ handoffSummaryAgent: "local" });
    release();
    expect(await old).toEqual([]);
    const disposed = f.options.loadProcessor("memory");
    f.options.close();
    release();
    expect(await disposed).toEqual([]);
    expect(f.report).not.toHaveBeenCalled();
  });
});
