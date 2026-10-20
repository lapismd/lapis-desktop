// SPDX-License-Identifier: Apache-2.0
// Retained Lapis AiPlugin conversation integration; see ../NOTICE.md.
import type { App, WorkspaceLeaf } from "@lapis-notes/api";
import type { ComposerTriggerItem } from "@lapismd/design-core/ai/chat";
import { bindTranscriptWriters } from "../../repository/transcript-writers.ts";
import { ConversationProtection } from "../conversations/transcript-protection.ts";
import { ConversationRepository } from "../conversations/conversation-repository.ts";
import { ownedConversationPersistence } from "./conversation-persistence.ts";
import { AiConversationIndex } from "../conversations/conversation-index.ts";
import { ConversationScopeResolver } from "../conversations/scope-resolver.ts";
import { hasHiddenApplicationSegment } from "../conversations/paths.ts";
import {
  conversationRouteFromState,
  type ConversationRoute,
} from "../conversations/conversation-route.ts";
import { openConversationRoute } from "./conversation-navigation.ts";
import type { ConversationLocation } from "../conversations/types.ts";
import { formatFileMention, searchVaultFiles } from "../chat/chat-mentions.ts";
import type { AiSettingsStore } from "../settings/settings-store.ts";
import type { AiPluginSettings } from "../settings/ai-settings.ts";
import { AI_VIEW, AI_HISTORY_VIEW, AI_CATALOG_VIEW } from "./view-types.ts";
import { AiOperations } from "./operations.ts";
import { ConversationDraftStore } from "../drafts/store.ts";

export function conversationLocationFromLeaf(
  leaf: WorkspaceLeaf,
): ConversationLocation | null {
  const route = conversationRouteFromState(leaf.view.getState());
  return route?.backend === "vault-files" ? route.location : null;
}
export class AiConversationHost {
  active = true;
  readonly operations = new AiOperations();
  readonly persistence;
  readonly drafts: ConversationDraftStore;
  readonly releaseTranscriptWriters;
  readonly conversations: ConversationRepository;
  readonly conversationIndex: AiConversationIndex;
  readonly scopeResolver = new ConversationScopeResolver();
  readonly #moves = new Set<(oldPath: string, newPath: string) => void>();
  #lastFileScope?: string;
  constructor(
    readonly app: App,
    readonly settings: AiSettingsStore,
  ) {
    this.persistence = ownedConversationPersistence(app);
    this.drafts = new ConversationDraftStore(app.vault);
    this.conversations = new ConversationRepository(this.persistence.store);
    this.conversations.protection = new ConversationProtection(
      app.fileEditingSessions,
      this.conversations,
      this.persistence.store,
      async () => {
        await app.vault.reconcile();
        await this.conversationIndex.rebuild();
      },
    );
    this.conversations.protection.onError = (error) =>
      app.logger.error("Conversation reload failed", error);
    this.releaseTranscriptWriters = bindTranscriptWriters(app, (path, apply) =>
      this.conversations.protection!.guard(path, apply),
    );
    this.conversationIndex = new AiConversationIndex(
      this.conversations,
      app.appDatabase,
    );
  }
  getSettings(): AiPluginSettings {
    return this.settings.get();
  }
  protected assertActive(): void {
    if (!this.active) throw new Error("AI is disabled");
  }
  async updateSettings(patch: Partial<AiPluginSettings>): Promise<void> {
    this.assertActive();
    return this.settings.update(patch);
  }
  subscribeSettings(listener: (patch: Partial<AiPluginSettings>) => void) {
    return this.settings.subscribe(listener);
  }
  subscribeConversationMoves(
    listener: (oldPath: string, newPath: string) => void,
  ) {
    this.#moves.add(listener);
    return () => {
      this.#moves.delete(listener);
    };
  }
  conversationMoved(oldPath: string, newPath: string): void {
    for (const listener of this.#moves) listener(oldPath, newPath);
  }
  rememberFileScope(leaf?: WorkspaceLeaf | null): void {
    if (leaf?.view.getViewType() === AI_VIEW) return;
    const file = this.app.workspace.getActiveFile();
    if (file)
      this.#lastFileScope = this.scopeResolver.resolve({
        activeFile: file,
      }).scopeDir;
  }
  currentConversationScope(): string {
    this.rememberFileScope();
    return this.#lastFileScope ?? this.createConversationInput().scopeDir;
  }
  createConversationInput(explicitFolder?: string) {
    const activeFile = this.app.workspace.getActiveFile();
    const { scopeDir } = this.scopeResolver.resolve({
      explicitFolder,
      activeFile,
    });
    const launchNotePath =
      activeFile && (!scopeDir || activeFile.path.startsWith(`${scopeDir}/`))
        ? activeFile.path
        : undefined;
    return { scopeDir, launchNotePath };
  }
  listConversationFolders(): string[] {
    return [
      ...new Set([
        "",
        ...this.app.vault
          .getAllFolders()
          .map((folder) => folder.path.replace(/^\/+|\/+$/gu, ""))
          .filter((path) => !hasHiddenApplicationSegment(path)),
      ]),
    ].sort((a, b) => a.localeCompare(b));
  }
  currentAiConversation(): ConversationLocation | null {
    const active = this.app.workspace.activeLeaf;
    if (active?.view.getViewType() === AI_VIEW) {
      const location = conversationLocationFromLeaf(active);
      if (location) return location;
    }
    for (const leaf of this.app.workspace.getLeavesOfType(AI_VIEW)) {
      const location = conversationLocationFromLeaf(leaf);
      if (location) return location;
    }
    return null;
  }
  searchAiConversations(query: string) {
    if (!this.active) return Promise.resolve([]);
    return this.operations.track(this.conversationIndex.search(query));
  }
  searchVaultFiles = async (
    query: string,
    signal: AbortSignal,
  ): Promise<ComposerTriggerItem[]> => {
    if (!this.active || signal.aborted) return [];
    const files = this.app.vault
      .getFiles()
      .map((file) => ({ path: file.path, name: file.basename }));
    return searchVaultFiles(files, query).map((file) => ({
      id: file.path,
      label: file.name,
      value: formatFileMention(file.path),
      description: file.path,
    }));
  };
  async openAiConversation(location?: ConversationLocation): Promise<void> {
    return openConversationRoute(
      this.app,
      () => this.assertActive(),
      location ? { version: 1, backend: "vault-files", location } : null,
    );
  }
  openAiConversationRoute(route: ConversationRoute): Promise<void> {
    return openConversationRoute(this.app, () => this.assertActive(), route);
  }
  async createAiConversation(scopeDir: string): Promise<void> {
    this.assertActive();
    const created = await this.conversations.create(
      this.createConversationInput(scopeDir),
    );
    await this.openAiConversation(created.location);
  }
  async revealPanel(type: string, side: "left" | "right"): Promise<void> {
    this.assertActive();
    const existing = this.app.workspace.getLeavesOfType(type)[0];
    const leaf = existing ?? this.app.workspace.ensureSideLeaf(type, side);
    if (!existing) await leaf.setViewState({ type, state: {} });
    this.assertActive();
    this.app.workspace.activateLeaf(leaf, {
      focusRootHost: false,
      source: "api",
      operation: `reveal-${type}`,
    });
    await this.app.workspace.revealLeaf(leaf);
  }
  revealConversationHistory() {
    return this.revealPanel(AI_HISTORY_VIEW, "right");
  }
  revealAiCatalog() {
    return this.revealPanel(AI_CATALOG_VIEW, "left");
  }
}
