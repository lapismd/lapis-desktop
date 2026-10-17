// SPDX-License-Identifier: Apache-2.0
// Retained Lapis chat orchestration; see ../../NOTICE.md.
import type { AgentRequest } from "../../core/runtime.ts";
import { type AiChatInventoryItem } from "../chat-items.ts";
import type { AppSkillDescriptor } from "../../skills/types.ts";
import { APP_TOOL_MCP_SERVER_NAME } from "../../tools/mcp-server-registry.ts";
import { SlashCommandRouter } from "../../commands/router.ts";
import { composerAgentLabel } from "../../commands/agent.ts";
import { formatSlashHelp } from "../../commands/groups.ts";
import type { AiChatController } from "../chat-controller.svelte.ts";
export async function _executeSlash(
  this: AiChatController,
  resolution: NonNullable<ReturnType<SlashCommandRouter["resolve"]>>,
  request: Omit<AgentRequest, "prompt">,
): Promise<void> {
  const slashRouter = this._slashRouter;
  if (!slashRouter || this.busy) return;
  this.error = null;
  if (this.repository) await this._ensureConversation();
  const discovery = this._skillContext?.() ?? {
    scopeDir: this.location?.scopeDir ?? "",
  };
  const result = await slashRouter.execute(resolution, {
    agentBindingId: this._activeBindingId,
    discovery,
  });
  if (result.kind === "error") {
    this.error = result.message;
    this.items = [
      ...this.items,
      {
        id: `command-error-${crypto.randomUUID()}`,
        type: "error",
        text: result.message,
        createdAt: new Date().toISOString(),
      },
    ];
    return;
  }
  if (result.kind === "local") {
    if (result.notice === "new") {
      await this.newConversation({
        scopeDir: this.location?.scopeDir ?? "",
      });
      return;
    }
    if (result.notice === "refresh") {
      await this.refreshSkills();
      this._appendLocalNotice("Agent skills refreshed.");
      return;
    }
    if (result.notice === "agent") {
      await this._applyAgentCommand(result.arguments ?? "");
      return;
    }
    if (result.notice === "help") {
      await this._withCommandProgress(async (turnId) => {
        await this._prepareSession(request, turnId);
        if (this._isAbandoned(turnId)) return;
        this._appendLocalNotice(
          formatSlashHelp(
            slashRouter.catalog.list(this._activeBindingId),
            composerAgentLabel(
              this.request.agent,
              typeof this.request.metadata?.runtime === "string"
                ? this.request.metadata.runtime
                : undefined,
            ),
          ),
        );
        await this._persistCommandNotice();
      });
      return;
    }
    if (result.notice === "scope") {
      await this._applyScopeCommand(result.arguments ?? "");
      return;
    }
    if (result.notice === "context") {
      await this._withCommandProgress(async (turnId) => {
        await this._prepareSession(request, turnId);
        if (this._isAbandoned(turnId)) return;
        this._appendLocalNotice(await this._describeContext());
        await this._persistCommandNotice();
      });
      return;
    }
    if (result.notice === "model") {
      await this._withCommandProgress(async (turnId) => {
        if (this._isAbandoned(turnId)) return;
        this._appendLocalNotice(
          "Change the model from the composer Model menu.",
        );
        await this._persistCommandNotice();
      });
      return;
    }
    if (result.notice === "cancel") {
      await this._withCommandProgress(async (turnId) => {
        if (this._isAbandoned(turnId)) return;
        this._appendLocalNotice(
          "Use Stop in the composer to cancel the active run.",
        );
        await this._persistCommandNotice();
      });
      return;
    }
    if (result.notice === "skills" || result.notice === "tools") {
      await this._withCommandProgress(async (turnId) => {
        await this._prepareSession(request, turnId);
        if (this._isAbandoned(turnId)) return;
        if (result.notice === "skills") {
          const snapshot = await this._effectiveSkillSnapshot();
          const items: AiChatInventoryItem[] = (snapshot?.skills ?? []).map(
            (skill) => ({
              name: skill.name,
              description: skill.description,
              kind: "skill",
              path: skillInventoryPath(this._skills?.getLoaded(skill.name)),
            }),
          );
          this._appendInventoryNotice(
            "skills",
            items,
            "No skills are available.",
          );
        } else {
          this._ensureLocalAppToolSession();
          const items: AiChatInventoryItem[] = (
            this._appToolHost?.getSession(this._activeBindingId ?? "")?.tools ??
            []
          ).map((tool) => ({
            name: tool.name,
            description: tool.description,
            kind: "tool",
          }));
          this._appendInventoryNotice(
            "tools",
            items,
            "No application tools are available.",
          );
        }
        await this._persistCommandNotice();
      });
      return;
    }
    this._appendLocalNotice(`/${result.notice}`);
    return;
  }
  if (result.kind === "tool") {
    await this._withCommandProgress(async (turnId) => {
      await this._prepareSession(request, turnId);
      if (this._isAbandoned(turnId)) return;
      this._ensureLocalAppToolSession();
      if (!this._appToolHost || !this._activeBindingId) {
        this.error = "Application tools are unavailable for this command.";
        this.items = [
          ...this.items,
          {
            id: `command-error-${crypto.randomUUID()}`,
            type: "error",
            text: this.error,
            createdAt: new Date().toISOString(),
          },
        ];
        return;
      }
      const callId = `slash-tool-${crypto.randomUUID()}`;
      const toolEvent = {
        id: callId,
        name: result.tool,
        server: APP_TOOL_MCP_SERVER_NAME,
        input: result.input,
      };
      await this._applySlashToolEvent({
        type: "tool.start",
        ...toolEvent,
      });
      try {
        const toolResult = await this._appToolHost.invoke(
          this._activeBindingId,
          {
            runId: callId,
            toolCallId: callId,
            name: result.tool,
            input: result.input,
          },
        );
        if (this._isAbandoned(turnId)) return;
        await this._applySlashToolEvent({
          type: "tool.end",
          ...toolEvent,
          ...(toolResult.isError
            ? { error: toolResult }
            : { output: toolResult }),
        });
      } catch (error) {
        if (this._isAbandoned(turnId)) return;
        await this._applySlashToolEvent({
          type: "tool.end",
          ...toolEvent,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
    return;
  }
  if (result.kind === "skill") {
    await this._submitWithActivation(result.activation, request);
    return;
  }
  if (result.kind === "prompt") {
    await this.submit(result.prompt, request);
    return;
  }
  if (result.kind === "native") {
    const text = `/${result.name}${
      result.arguments ? ` ${result.arguments}` : ""
    }`;
    await this._recordCommandItem(
      result.name,
      "native-agent",
      result.arguments,
    );
    this.busy = true;
    try {
      await this._prepareSession(request);
      await this.session?.send(text);
    } finally {
      this.busy = false;
    }
  }
}

export function skillInventoryPath(
  skill: AppSkillDescriptor | undefined,
): string | undefined {
  if (!skill || skill.source === "programmatic") return undefined;
  if (skill.root.includes(":") || skill.root.startsWith("bundled/")) {
    return undefined;
  }
  return skill.root.endsWith("SKILL.md")
    ? skill.root
    : `${skill.root}/SKILL.md`;
}
