// SPDX-License-Identifier: Apache-2.0
// Retained source regression coverage; see src/lib/ai/NOTICE.md.
import { expect, it, vi } from "vitest";
import { ComposerModelCatalog } from "../../../src/lib/ai/chat/composer-model-catalog.ts";

it("clears prior options while loading and replaces missing saved models with the provider default", async () => {
  const update = vi.fn();
  const catalog = new ComposerModelCatalog(
    async () => [
      { provider: "cursor", model: "other" },
      { provider: "cursor", model: "default", isDefault: true },
      { provider: "codex", model: "wrong-agent" },
    ],
    update,
  );
  await catalog.refresh("cursor", "acp", "missing");
  expect(update.mock.calls[0]![0]).toMatchObject({
    loading: true,
    models: [],
    error: null,
  });
  expect(update.mock.lastCall![0]).toMatchObject({
    loading: false,
    model: "default",
    models: [
      { provider: "cursor", model: "other" },
      { provider: "cursor", model: "default", isDefault: true },
    ],
  });
});

it("preserves that harness's saved model and surfaces a failed refresh", async () => {
  const update = vi.fn();
  const catalog = new ComposerModelCatalog(async () => {
    throw new Error("Controller unavailable");
  }, update);
  await catalog.refresh("cursor", "acp", "saved-cursor");
  expect(update.mock.lastCall![0]).toMatchObject({
    model: "saved-cursor",
    models: [],
    loading: false,
    error: "Controller unavailable",
  });
});

it("ignores an earlier harness result arriving after the new selection", async () => {
  let resolve!: (value: { provider: string; model: string }[]) => void;
  const delayed = new Promise<{ provider: string; model: string }[]>((r) => {
    resolve = r;
  });
  const update = vi.fn();
  const catalog = new ComposerModelCatalog(
    async (agent) =>
      agent === "codex"
        ? delayed
        : [{ provider: "cursor", model: "cursor-model" }],
    update,
  );
  const old = catalog.refresh("codex", "codex-native", "");
  await catalog.refresh("cursor", "acp", "");
  resolve([{ provider: "codex", model: "late-codex" }]);
  await old;
  expect(update).toHaveBeenCalledTimes(3);
  expect(update.mock.lastCall![0]).toMatchObject({
    agent: "cursor",
    model: "cursor-model",
  });
});

it("ignores pending discovery after disposal", async () => {
  let reject!: (error: Error) => void;
  const delayed = new Promise<never>((_, r) => {
    reject = r;
  });
  const update = vi.fn();
  const catalog = new ComposerModelCatalog(() => delayed, update);
  const pending = catalog.refresh("codex", "acp", "saved");
  catalog.cancel();
  reject(new Error("Late failure"));
  await pending;
  expect(update).toHaveBeenCalledOnce();
});
