// SPDX-License-Identifier: Apache-2.0
// Retained Lapis chat presentation state; see ../../NOTICE.md.
import { normalizeConversationScope } from "../../conversations/paths.ts";
import {
  formatDirectoryContextLabel,
  groupConversationsByRelativeScope,
} from "../../conversations/scope-tree.ts";
import { revealConversationScope } from "../../conversations/reveal-scope.ts";
import type { AiChatController } from "../chat-controller.svelte.ts";
import type { AiChatPanelProps } from "./props.ts";
class ConversationsPanelState {
  scopePickerOpen = $state(false);
  scopeFolders = $state<string[]>([""]);
  showPicker = $derived.by(() => {
    return this.controller.pickerEntries.length >= 2;
  });
  pickerGroups = $derived.by(() => {
    return groupConversationsByRelativeScope(
      this.controller.pickerEntries,
      this.controller.directoryContext,
    );
  });
  scopePathLabel = $derived.by(() => {
    return formatDirectoryContextLabel(
      this.controller.directoryContext ||
        this.controller.location?.scopeDir ||
        "",
    );
  });
  isEmpty = $derived.by(() => {
    return (
      !this.showPicker &&
      this.controller.items.length === 0 &&
      !this.controller.busy
    );
  });

  constructor(
    private readonly getProps: () => AiChatPanelProps,
    private readonly controller: AiChatController,
  ) {
    this.loadConversationFolders = this.loadConversationFolders.bind(this);
    this.onScopePickerOpenChange = this.onScopePickerOpenChange.bind(this);
    this.changeConversationScope = this.changeConversationScope.bind(this);
    this.directoryScope = this.directoryScope.bind(this);
  }
  loadConversationFolders(): void {
    const { listConversationFolders } = this.getProps();

    const current =
      this.controller.directoryContext ||
      this.controller.location?.scopeDir ||
      "";
    const folders = new Set<string>();
    for (const candidate of [
      "",
      current,
      ...(listConversationFolders?.() ?? []),
    ]) {
      try {
        folders.add(normalizeConversationScope(candidate));
      } catch {
        // Ignore stale or invalid host catalogue entries.
      }
    }
    this.scopeFolders = [...folders].sort((left, right) => {
      if (!left) return -1;
      if (!right) return 1;
      return left.localeCompare(right);
    });
  }
  onScopePickerOpenChange(open: boolean): void {
    this.scopePickerOpen = open;
    if (open) this.loadConversationFolders();
  }
  async changeConversationScope(scopeDir: string): Promise<void> {
    const { initializing = false, repository, app } = this.getProps();

    if (initializing || this.controller.busy || !repository) return;
    this.scopePickerOpen = false;
    revealConversationScope(app, scopeDir);
    await this.controller.followDirectoryScope(scopeDir, { force: true });
  }
  directoryScope(): string {
    const { currentConversationScope } = this.getProps();

    return currentConversationScope?.() ?? "";
  }
}
export function createConversationsState(
  getProps: () => AiChatPanelProps,
  controller: AiChatController,
) {
  return new ConversationsPanelState(getProps, controller);
}
export type ConversationsState = ConversationsPanelState;
