// SPDX-License-Identifier: Apache-2.0
import type { ComposerState } from "./composer.svelte.ts";
import type { AiChatPanelProps } from "./props.ts";
import {
  catalogModelsForAgent,
  type AcpAgentId,
} from "../../settings/acp-agents.ts";

export function changeComposerAgent(
  composer: ComposerState,
  props: AiChatPanelProps,
  agent: AcpAgentId,
  runtime: "acp" | "codex-native" | "opencode-native",
) {
  if (
    composer.recipients.selectedId !== null &&
    composer.recipientOptions.find(
      (entry) => entry.id === composer.recipients.selectedId,
    )?.agent !== agent
  )
    composer.removeRecipient();
  const { settings, models = [], loadModels } = props;
  if (agent !== composer.selectedAgent) composer.localThinking = "default";
  composer.localAgent = agent;
  composer.localRuntime = runtime;
  const configured = settings?.defaultModels?.[agent];
  composer.localModel =
    configured ||
    catalogModelsForAgent(agent, models).find((model) => model.isDefault)
      ?.model ||
    catalogModelsForAgent(agent, models)[0]?.model ||
    "";
  composer.persistComposerDefaults(
    agent,
    runtime,
    composer.localModel,
    composer.selectedThinking,
  );
  if (loadModels)
    void composer.catalog.refresh(
      agent,
      runtime,
      configured ?? composer.localModel ?? "",
    );
}
