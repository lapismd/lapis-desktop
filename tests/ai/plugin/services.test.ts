// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it, vi } from "vitest";
import {
  selectAiRuntime,
  type AiServices,
} from "../../../src/lib/ai/plugin/services.ts";
import { FakeAgentRuntime } from "../support/fake-runtime.ts";
function services(reason: string | null = null): AiServices {
  return {
    runtime: new FakeAgentRuntime({ id: "acp" }),
    models: { listModels: async () => [] },
    unavailableReason: () => reason,
    close: async () => {},
  };
}
describe("desktop-owned runtime selection", () => {
  for (const runtime of [
    "fake",
    "codex-native",
    "opencode-native",
    "unrecognized",
  ]) {
    it(`keeps saved ${runtime} inert without contacting an admitted agent`, async () => {
      const port = services();
      const supports = vi.spyOn(port.runtime, "supports");
      await expect(
        selectAiRuntime(port, { prompt: "", metadata: { runtime } }),
      ).rejects.toThrow("unavailable");
      expect(supports).not.toHaveBeenCalled();
    });
  }
  it("selects the exact ACP port without starting a worker or changing the request", async () => {
    const port = services();
    const supports = vi.spyOn(port.runtime, "supports");
    const start = vi.spyOn(port.runtime, "start");
    const request = {
      prompt: "",
      agent: "cursor",
      model: { provider: "cursor", model: "saved" },
      metadata: { runtime: "acp" },
    };
    expect(await selectAiRuntime(port, request)).toBe(port.runtime);
    expect(supports).toHaveBeenCalledWith(request);
    expect(start).not.toHaveBeenCalled();
    expect(request.model).toEqual({ provider: "cursor", model: "saved" });
  });
  it("reports unavailable admission without provider probing", async () => {
    const port = services("Vault admission is unavailable");
    const supports = vi.spyOn(port.runtime, "supports");
    await expect(selectAiRuntime(port, { prompt: "" })).rejects.toThrow(
      "Vault admission is unavailable",
    );
    expect(supports).not.toHaveBeenCalled();
  });
  it("rejects unsupported requests and propagates native failures without a fallback", async () => {
    const port = services();
    vi.spyOn(port.runtime, "supports")
      .mockResolvedValueOnce(false)
      .mockRejectedValueOnce(new Error("Native scope revoked"));
    await expect(
      selectAiRuntime(port, { prompt: "", restricted: true }),
    ).rejects.toThrow("does not support");
    await expect(selectAiRuntime(port, { prompt: "" })).rejects.toThrow(
      "Native scope revoked",
    );
  });
});
