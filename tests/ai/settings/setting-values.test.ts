import { describe, expect, it } from "vitest";
import { AppToolRegistry } from "@lapis-notes/api/agent-tools";
import {
  aiSettingPatch,
  readAiSetting,
} from "../../../src/lib/ai/settings/setting-values.ts";
import { mergeAiSettings } from "../../../src/lib/ai/settings/ai-settings.ts";

function registry() {
  const tools = new AppToolRegistry();
  const register = (name: string, source: "official" | "community") =>
    tools.register(
      {
        pluginId: source === "community" ? "counter" : "notes",
        source,
        provenance: source === "community" ? "community" : "official",
      },
      {
        name,
        description: name,
        effect: "read",
        inputSchema: { type: "object" },
        execute: async () => ({ content: [] }),
      },
    );
  register("read", "official");
  const community = register("community_count", "community");
  return { tools, community };
}

describe("AI controlled setting values", () => {
  it("retains deferred historical runtime preferences without offering new execution authority", () => {
    const { tools } = registry();
    const settings = mergeAiSettings({
      defaultRuntime: "codex-native",
      memoryConsolidationRuntime: "codex-native",
      handoffSummaryRuntime: "codex-native",
    });
    for (const id of [
      "ai.defaultRuntime",
      "ai.memoryConsolidationRuntime",
      "ai.handoffSummaryRuntime",
    ]) {
      expect(readAiSetting(settings, id, tools)).toBe("codex-native");
      expect(() => aiSettingPatch(settings, id, "codex-native", tools)).toThrow(
        "Invalid AI setting",
      );
      expect(aiSettingPatch(settings, id, "acp", tools)).toBeTruthy();
    }
    expect(settings.defaultRuntime).toBe("codex-native");
  });

  it("rejects unknown IDs, runtimes, agents, thinking levels and non-boolean toggles", () => {
    const { tools } = registry();
    const settings = mergeAiSettings(null);
    for (const [id, value] of [
      ["ai.defaultRuntime", "fake"],
      ["ai.acpAgent", "unknown"],
      ["ai.thinking", "unbounded"],
      ["ai.memoryAutomaticRecall", "true"],
      ["ai.defaultModel", 123],
      ["ai.secret", true],
    ]) {
      expect(() =>
        aiSettingPatch(settings, String(id), value, tools),
      ).toThrow();
    }
  });

  it("retains first-party defaults and requires explicit community tool opt-in", () => {
    const { tools, community } = registry();
    const settings = mergeAiSettings(null);
    expect(readAiSetting(settings, "ai.appTools.read", tools)).toBe(true);
    expect(readAiSetting(settings, "ai.appTools.community_count", tools)).toBe(
      false,
    );
    const enabled = {
      ...settings,
      ...aiSettingPatch(settings, "ai.appTools.community_count", true, tools),
    };
    expect(readAiSetting(enabled, "ai.appTools.community_count", tools)).toBe(
      true,
    );
    expect(enabled.enabledAppToolNames).toEqual(["community_count"]);
    community.dispose();
    expect(
      readAiSetting(enabled, "ai.appTools.community_count", tools),
    ).toBeUndefined();
    expect(() =>
      aiSettingPatch(enabled, "ai.appTools.community_count", true, tools),
    ).toThrow("no longer registered");
  });
});
