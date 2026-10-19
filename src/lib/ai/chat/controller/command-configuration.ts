// SPDX-License-Identifier: Apache-2.0
// Retained Lapis chat orchestration; see ../../NOTICE.md.
import { composerAgentLabel, parseAgentCommand } from "../../commands/agent.ts";
import {
  buildAgentBootstrap,
  buildSessionBootstrap,
} from "../../bootstrap/build.ts";
import { hasHostFilesystemPath } from "../../skills/manifest.ts";
import {
  formatContextNotice,
  formatScopeNotice,
} from "../../commands/inspect.ts";
import { normalizeConversationScope } from "../../conversations/paths.ts";
import type { AiChatController } from "../chat-controller.svelte.ts";
export async function _applyAgentCommand(
  this: AiChatController,
  raw: string,
): Promise<boolean> {
  const parsed = parseAgentCommand(raw);
  if (parsed === "unknown") {
    this.error = `Unknown agent: ${raw.trim()}`;
    this.items = [
      ...this.items,
      {
        id: `command-error-${crypto.randomUUID()}`,
        type: "error",
        text: this.error,
        createdAt: new Date().toISOString(),
      },
    ];
    return false;
  }
  if (parsed === "status") {
    return this._withCommandProgress(async (turnId) => {
      if (this._isAbandoned(turnId)) return;
      this._appendLocalNotice(
        composerAgentLabel(
          this.request.agent,
          typeof this.request.metadata?.runtime === "string"
            ? this.request.metadata.runtime
            : undefined,
        ),
      );
      await this._persistCommandNotice();
    });
  }
  this.request = {
    ...this.request,
    agent: parsed.agent,
    metadata: {
      ...this.request.metadata,
      runtime: parsed.runtimePreference,
    },
  };
  this._sessionRequest = { ...this.request };
  this._onComposerDefaults?.({
    agent: parsed.agent,
    runtimePreference: parsed.runtimePreference,
  });
  if (this.session) {
    await this.cancelAndSwitch({
      agent: parsed.agent,
      metadata: this.request.metadata,
    });
  }
  this._appendLocalNotice(`Agent: ${parsed.label}`);
  await this._persistCommandNotice();
  return !this._disposed && !this.error;
}

export async function _applyScopeCommand(
  this: AiChatController,
  raw: string,
): Promise<void> {
  const folder = raw.trim();
  if (!folder) {
    await this._withCommandProgress(async (turnId) => {
      if (this._isAbandoned(turnId)) return;
      this._appendLocalNotice(await this._describeScope());
      await this._persistCommandNotice();
    });
    return;
  }
  try {
    const scopeDir = normalizeConversationScope(folder);
    const input = this._createConversation?.(scopeDir) ?? { scopeDir };
    await this.newConversation({
      ...input,
      scopeDir,
    });
    this._appendLocalNotice(await this._describeScope("explicit"));
    await this._persistCommandNotice();
  } catch (error) {
    this.error = error instanceof Error ? error.message : String(error);
    this.items = [
      ...this.items,
      {
        id: `command-error-${crypto.randomUUID()}`,
        type: "error",
        text: this.error,
        createdAt: new Date().toISOString(),
      },
    ];
  }
}

export async function _describeScope(
  this: AiChatController,
  source?: "explicit" | "active-file" | "vault-root" | "conversation",
): Promise<string> {
  const snapshot =
    this.repository && this.location
      ? await this.repository.read(this.location).catch(() => undefined)
      : undefined;
  const pending = this._createConversation?.();
  const scopeDir = this.location?.scopeDir ?? pending?.scopeDir ?? "";
  return formatScopeNotice({
    scopeDir,
    launchNotePath:
      snapshot?.metadata.launchContext?.notePath ?? pending?.launchNotePath,
    workspace: snapshot?.metadata.workspace?.path ?? this.workspace,
    source:
      source ??
      (this.location ? "conversation" : scopeDir ? "folder" : "vault-root"),
  });
}

export async function _describeContext(
  this: AiChatController,
): Promise<string> {
  const snapshot =
    this.repository && this.location
      ? await this.repository.read(this.location).catch(() => undefined)
      : undefined;
  const pending = this._createConversation?.();
  const binding = this._activeBinding;
  const scopeDir = this.location?.scopeDir ?? pending?.scopeDir ?? "";
  const bootstrap = await buildAgentBootstrap({
    conversationId: this.location?.conversationId ?? snapshot?.metadata.id,
    scopeDir,
    launchNotePath:
      snapshot?.metadata.launchContext?.notePath ?? pending?.launchNotePath,
    workspaceLabel: portableWorkspaceLabel(
      snapshot?.metadata.workspace?.path ?? this.workspace,
    ),
    readText: this._readVaultText,
  });
  return formatContextNotice({
    conversationId: this.location?.conversationId ?? snapshot?.metadata.id,
    scopeDir,
    launchNotePath:
      snapshot?.metadata.launchContext?.notePath ?? pending?.launchNotePath,
    workspace: bootstrap.workspace?.label,
    agent: composerAgentLabel(
      this.request.agent,
      typeof this.request.metadata?.runtime === "string"
        ? this.request.metadata.runtime
        : undefined,
    ),
    model: this.request.model?.model ?? binding?.model?.model,
    tools:
      this._appToolHost
        ?.getSession(this._activeBindingId ?? "")
        ?.tools.map((tool) => tool.name) ?? [],
    skills:
      (await this._effectiveSkillSnapshot())?.skills.map(
        (skill) => skill.name,
      ) ?? [],
    folderInstructionPaths: bootstrap.folderInstructions
      .filter((entry) => !entry.omitted)
      .map((entry) => entry.path),
    truncated: bootstrap.truncated,
  });
}

export async function _sessionBootstrapMetadata(
  this: AiChatController,
  scopeDir: string,
  launchNotePath: string | undefined,
  conversationId: string | undefined,
  tools: readonly { name: string; description: string }[],
  skills: readonly { name: string; description: string; version: string }[],
): Promise<Record<string, string>> {
  try {
    const { text } = await buildSessionBootstrap({
      conversationId,
      scopeDir,
      launchNotePath,
      workspaceLabel: portableWorkspaceLabel(this.workspace),
      tools,
      skills,
      readText: this._readVaultText,
    });
    return { sessionBootstrap: text };
  } catch {
    return {};
  }
}

export function portableWorkspaceLabel(value?: string): string | undefined {
  const label = value?.trim();
  if (!label || hasHostFilesystemPath(label)) return undefined;
  return label;
}
