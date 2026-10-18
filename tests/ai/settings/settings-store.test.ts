import { describe, expect, it, vi } from "vitest";
import { AiSettingsStore } from "../../../src/lib/ai/settings/settings-store.ts";

describe("owned AI settings", () => {
  it("retains historical state while persisting independent provider models", async () => {
    const save = vi.fn(async () => {});
    const store = new AiSettingsStore(save);
    store.hydrate({
      settings: { defaultRuntime: "codex-native", defaultModel: "old-model" },
      sessions: [{ id: "controller-history" }],
      futureValue: { retained: true },
    });
    await store.update({ acpAgent: "cursor", defaultModel: "composer" });
    expect(store.get()).toMatchObject({
      defaultRuntime: "codex-native",
      acpAgent: "cursor",
      defaultModel: "composer",
      defaultModels: { codex: "old-model", cursor: "composer" },
    });
    expect(save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        sessions: [{ id: "controller-history" }],
        futureValue: { retained: true },
      }),
    );
    await store.update({ acpAgent: "codex" });
    expect(store.get().defaultModel).toBe("old-model");
  });

  it("publishes changes only after a durable write and recovers after failure", async () => {
    const save = vi
      .fn()
      .mockRejectedValueOnce(new Error("Disk full"))
      .mockResolvedValue(undefined);
    const store = new AiSettingsStore(save);
    const listener = vi.fn();
    store.subscribe(listener);
    await expect(store.update({ thinking: "high" })).rejects.toThrow(
      "Disk full",
    );
    expect(store.get().thinking).toBe("medium");
    expect(listener).not.toHaveBeenCalled();
    await store.update({ thinking: "low" });
    expect(store.get().thinking).toBe("low");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("serializes edits without losing another field or provider's choice", async () => {
    let finish!: () => void;
    const first = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const save = vi
      .fn()
      .mockImplementationOnce(() => first)
      .mockResolvedValue(undefined);
    const store = new AiSettingsStore(save);
    const one = store.update({ thinking: "high" });
    const two = store.update({ memoryAutomaticRecall: true });
    finish();
    await Promise.all([one, two]);
    expect(store.get()).toMatchObject({
      thinking: "high",
      memoryAutomaticRecall: true,
    });
    expect(save.mock.calls[1][0].settings).toMatchObject({
      thinking: "high",
      memoryAutomaticRecall: true,
    });
  });

  it("migrates available community opt-ins and preserves undiscovered owners", async () => {
    const save = vi.fn(async () => {});
    const store = new AiSettingsStore(save, () => [
      {
        name: "community_count",
        owner: { pluginId: "counter", source: "community" },
      },
    ]);
    store.hydrate({
      settings: { enabledCommunityToolPluginIds: ["counter", "later"] },
    });
    await store.update({});
    expect(store.get().enabledAppToolNames).toEqual(["community_count"]);
    expect(store.get().enabledCommunityToolPluginIds).toEqual(["later"]);
    await store.update({});
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("does not expose mutable stored settings and releases subscriptions", async () => {
    const store = new AiSettingsStore(async () => {});
    const copy = store.get();
    copy.defaultModels.codex = "mutated";
    copy.disabledAppToolNames.push("read");
    expect(store.get().defaultModels.codex).toBe("gpt-5.6-sol");
    expect(store.get().disabledAppToolNames).toEqual([]);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    await store.update({ thinking: "high" });
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("transcript presentation preferences", () => {
  it("defaults to document, restores classic after reload and isolates vaults", async () => {
    let saved: Record<string, unknown> = {};
    const one = new AiSettingsStore(async (data) => {
      saved = structuredClone(data);
    });
    const two = new AiSettingsStore(async () => {});
    expect(one.get().transcriptView).toBe("document");
    await one.update({ transcriptView: "classic" });
    const reloaded = new AiSettingsStore(async () => {});
    reloaded.hydrate(saved);
    expect(reloaded.get().transcriptView).toBe("classic");
    expect(two.get().transcriptView).toBe("document");
  });
  it("retains the saved preference when persistence fails", async () => {
    const store = new AiSettingsStore(async () => {
      throw new Error("Read-only vault");
    });
    await expect(store.update({ transcriptView: "classic" })).rejects.toThrow(
      "Read-only vault",
    );
    expect(store.get().transcriptView).toBe("document");
    store.hydrate({ settings: { transcriptView: "unexpected" } });
    expect(store.get().transcriptView).toBe("document");
  });
});
