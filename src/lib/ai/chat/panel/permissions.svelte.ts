// SPDX-License-Identifier: Apache-2.0
import type { AgentRecipientOption } from "../../conversations/recipients.ts";
import { defaultExecutionMode } from "../../core/agent-profile.ts";
import type { AiChatController } from "../chat-controller.svelte.ts";
import type { AiChatPanelProps } from "./props.ts";

/** Conversation choices never mutate agent defaults or already captured queues. */
export class ComposerPermissions {
  overrides = $state<Record<string, string>>({});
  loading = $state(false);
  saving = $state(false);
  #generation = 0;
  constructor(
    private readonly props: () => AiChatPanelProps,
    private readonly controller: AiChatController,
  ) {
    $effect(() => {
      const location = controller.location,
        repository = this.props().repository;
      const generation = ++this.#generation;
      this.overrides = {};
      this.loading = Boolean(location && repository);
      if (!location || !repository) return;
      void repository
        .read(location)
        .then((snapshot) => {
          if (generation === this.#generation)
            this.overrides = { ...snapshot.metadata.executionModes };
        })
        .catch((error) => {
          if (generation === this.#generation) this.report(error);
        })
        .finally(() => {
          if (generation === this.#generation) this.loading = false;
        });
      return () => {
        ++this.#generation;
      };
    });
  }
  modeFor(
    profile: Pick<AgentRecipientOption, "id" | "executionMode">,
  ): string | undefined {
    return Object.hasOwn(this.overrides, profile.id)
      ? this.overrides[profile.id]
      : profile.executionMode;
  }
  effective(
    profile: Pick<AgentRecipientOption, "id" | "executionMode" | "agent">,
  ): string {
    return this.modeFor(profile) ?? defaultExecutionMode(profile.agent);
  }
  async change(id: string, mode?: string) {
    if (
      this.controller.busy ||
      this.saving ||
      this.loading ||
      this.controller._filesProtected
    )
      return;
    this.saving = true;
    try {
      const repository = this.props().repository;
      if (repository) {
        await this.controller._ensureConversation();
        const location = this.controller.location;
        if (!location) throw new Error("Conversation is unavailable");
        const next = await repository.permissions.write(location, id, mode);
        if (
          this.controller.location?.conversationId !==
            location.conversationId ||
          this.controller.location.scopeDir !== location.scopeDir
        )
          return;
        ++this.#generation;
        this.overrides = next;
        this.loading = false;
      } else {
        const next = new Map(Object.entries(this.overrides));
        if (mode) next.set(id, mode);
        else next.delete(id);
        this.overrides = Object.fromEntries(next);
      }
    } catch (error) {
      this.report(error);
    } finally {
      this.saving = false;
    }
  }
  report(error: unknown) {
    this.props().app?.notifications.notify({
      id: "ai-chat-permissions",
      source: "ai",
      title: "Agent permissions",
      severity: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
