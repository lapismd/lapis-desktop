import { describe, expect, it, vi } from "vitest";
import { AiSettingsStore } from "../../../src/lib/ai/settings/settings-store.ts";
import {
  AiModelOptions,
  type AiModelCatalog,
} from "../../../src/lib/ai/settings/model-options.ts";
import type { ModelRef } from "../../../src/lib/ai/core/models.ts";

function optionsFor(
  store: AiSettingsStore,
  models: AiModelCatalog,
  report = vi.fn(),
) {
  return new AiModelOptions(store, models, report);
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

describe("owned AI model option sources", () => {
  it("uses ACP inventory, filters other providers and retains default selection behavior", async () => {
    const save = vi.fn(async () => {});
    const store = new AiSettingsStore(save);
    const listModels = vi.fn(async () => [
      { provider: "cursor", model: "wrong" },
      { provider: "codex", model: "first" },
      { provider: "codex", model: "preferred", isDefault: true },
    ]);
    const options = optionsFor(store, { listModels });
    expect((await options.load("codex")).map((option) => option.value)).toEqual(
      ["first", "preferred"],
    );
    expect(listModels).toHaveBeenCalledWith("codex", "acp");
    expect(store.get().defaultModels.codex).toBe("preferred");
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("keeps the saved model on empty or unavailable catalogs", async () => {
    const save = vi.fn(async () => {});
    const store = new AiSettingsStore(save);
    const options = optionsFor(store, {
      listModels: vi
        .fn()
        .mockResolvedValueOnce([])
        .mockRejectedValueOnce(new Error("Provider unavailable")),
    });
    expect(await options.load("codex")).toEqual([
      expect.objectContaining({
        value: "gpt-5.6-sol",
        description: expect.stringContaining("no catalog"),
      }),
    ]);
    expect(await options.load("codex")).toEqual([
      expect.objectContaining({
        value: "gpt-5.6-sol",
        description: expect.stringContaining("Provider unavailable"),
      }),
    ]);
    expect(save).not.toHaveBeenCalled();
  });

  it("does not replace a deferred runtime's saved model merely by opening Settings", async () => {
    const save = vi.fn(async () => {});
    const store = new AiSettingsStore(save);
    store.hydrate({
      settings: {
        defaultRuntime: "codex-native",
        defaultModel: "historical-native-model",
      },
    });
    const options = optionsFor(store, {
      listModels: async () => [{ provider: "codex", model: "acp-default" }],
    });
    expect(await options.load("codex")).toContainEqual(
      expect.objectContaining({ value: "historical-native-model" }),
    );
    expect(store.get().defaultModel).toBe("historical-native-model");
    expect(save).not.toHaveBeenCalled();
    await store.update({ defaultRuntime: "acp" });
    await options.load("codex");
    expect(store.get().defaultModel).toBe("acp-default");
  });

  it("keeps the saved model visible when persisting an inventory default fails", async () => {
    const save = vi
      .fn()
      .mockRejectedValueOnce(new Error("Disk full"))
      .mockResolvedValue(undefined);
    const store = new AiSettingsStore(save);
    const report = vi.fn();
    const options = optionsFor(
      store,
      {
        listModels: async () => [{ provider: "codex", model: "replacement" }],
      },
      report,
    );
    await expect(options.load("codex")).resolves.toContainEqual(
      expect.objectContaining({ value: "gpt-5.6-sol" }),
    );
    expect(store.get().defaultModel).toBe("gpt-5.6-sol");
    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Disk full" }),
    );
    await options.load("codex");
    expect(store.get().defaultModel).toBe("replacement");
    expect(report).toHaveBeenCalledTimes(1);
  });

  it("does not overwrite a manual model change while inventory is loading", async () => {
    const pending = deferred<ModelRef[]>();
    const store = new AiSettingsStore(async () => {});
    const options = optionsFor(store, {
      listModels: () => pending.promise,
    });
    const loading = options.load("codex");
    await store.update({ defaultModel: "user-choice" });
    pending.resolve([{ provider: "codex", model: "inventory-default" }]);
    await loading;
    expect(store.get().defaultModel).toBe("user-choice");
  });

  it.each(["empty", "failed"])(
    "keeps updated saved choices visible after a late %s inventory",
    async (outcome) => {
      const pending = deferred<ModelRef[]>();
      const store = new AiSettingsStore(async () => {});
      const options = optionsFor(store, {
        listModels: () => pending.promise,
      });
      const loading = options.load("codex");
      await store.update({ defaultModel: "newer-user-choice" });
      if (outcome === "empty") pending.resolve([]);
      else pending.reject(new Error("Catalog unavailable"));
      expect(await loading).toContainEqual(
        expect.objectContaining({ value: "newer-user-choice" }),
      );
      expect(store.get().defaultModel).toBe("newer-user-choice");
    },
  );

  it("keeps an old provider result separate from the newly selected provider", async () => {
    const pending = deferred<ModelRef[]>();
    const store = new AiSettingsStore(async () => {});
    const options = optionsFor(store, {
      listModels: () => pending.promise,
    });
    const loading = options.load("codex");
    await store.update({ acpAgent: "cursor", defaultModel: "cursor-choice" });
    pending.resolve([{ provider: "codex", model: "codex-default" }]);
    await loading;
    expect(store.get()).toMatchObject({
      acpAgent: "cursor",
      defaultModel: "cursor-choice",
      defaultModels: { codex: "codex-default", cursor: "cursor-choice" },
    });
  });

  it("fences superseded requests and work completed after plugin disposal", async () => {
    const old = deferred<ModelRef[]>();
    const late = deferred<ModelRef[]>();
    const save = vi.fn(async () => {});
    const store = new AiSettingsStore(save);
    const listModels = vi
      .fn()
      .mockReturnValueOnce(old.promise)
      .mockResolvedValueOnce([{ provider: "codex", model: "latest" }])
      .mockReturnValueOnce(late.promise);
    const options = optionsFor(store, { listModels });
    const stale = options.load("codex");
    await options.load("codex");
    old.resolve([{ provider: "codex", model: "stale" }]);
    expect(await stale).toEqual([]);
    const afterClose = options.load("codex");
    options.close();
    late.resolve([{ provider: "codex", model: "disposed" }]);
    expect(await afterClose).toEqual([]);
    expect(store.get().defaultModel).toBe("latest");
    expect(save).toHaveBeenCalledTimes(1);
    await expect(options.load("codex")).rejects.toThrow("unavailable");
  });
});
