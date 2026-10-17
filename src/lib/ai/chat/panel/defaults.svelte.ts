// SPDX-License-Identifier: Apache-2.0
// Retained Lapis chat defaults observation; see ../../NOTICE.md.
import { untrack } from "svelte";
import { normalizeAcpAgent } from "../../settings/acp-agents.ts";
import { DEFAULT_AI_SETTINGS } from "../../settings/ai-settings.ts";
import type { AiChatPanelProps } from "./props.ts";
import type { ComposerState } from "./composer.svelte.ts";

export function observeComposerDefaults(
  getProps: () => AiChatPanelProps,
  state: ComposerState,
): void {
  let observedDefaults: {
    agent: ComposerState["selectedAgent"];
    runtime: ComposerState["selectedRuntime"];
    model: string;
    thinking: ComposerState["selectedThinking"];
  } | null = null;
  $effect(() => {
    const { initializing = false, settings, loadModels } = getProps();

    if (initializing) return;
    const next = {
      agent: normalizeAcpAgent(settings?.acpAgent),
      runtime:
        settings?.defaultRuntime === "codex-native"
          ? ("codex-native" as const)
          : settings?.defaultRuntime === "opencode-native"
            ? ("opencode-native" as const)
            : settings?.defaultRuntime === "fake"
              ? ("fake" as const)
              : ("acp" as const),
      model: settings?.defaultModel ?? DEFAULT_AI_SETTINGS.defaultModel,
      thinking: settings?.thinking ?? DEFAULT_AI_SETTINGS.thinking,
    };
    untrack(() => {
      const previous = observedDefaults;
      observedDefaults = next;
      if (!previous) return;
      const harnessChanged =
        previous.agent !== next.agent || previous.runtime !== next.runtime;
      if (
        harnessChanged &&
        ((state.localAgent ?? previous.agent) !== next.agent ||
          (state.localRuntime ?? previous.runtime) !== next.runtime)
      ) {
        state.localAgent = next.agent;
        state.localRuntime = next.runtime;
        state.localModel = next.model;
        state.catalog.cancel();
        if (next.runtime === "fake") {
          state.catalogState = {
            ...next,
            runtime: "fake",
            models: [],
            loading: false,
            error: null,
          };
        } else if (loadModels) {
          void state.catalog.refresh(next.agent, next.runtime, next.model);
        }
      } else if (previous.model !== next.model) {
        state.localModel = next.model;
      }
      if (previous.thinking !== next.thinking)
        state.localThinking = next.thinking;
    });
  });
}
