// SPDX-License-Identifier: Apache-2.0
// Retained Lapis chat lifecycle; see ../../NOTICE.md.
import { onMount, untrack } from "svelte";
import type { WorkspaceLeaf } from "@lapis-notes/api";
import type { AiChatController } from "../chat-controller.svelte.ts";
import type { AiChatPanelProps } from "./props.ts";
import type { ConversationsState } from "./conversations.svelte.ts";

export function observeChatPanel(
  getProps: () => AiChatPanelProps,
  controller: AiChatController,
  conversations: ConversationsState,
  perform: (operation: () => unknown | Promise<unknown>) => Promise<void>,
): void {
  $effect(() => {
    const { runtime, mcpServers = [] } = getProps();
    controller.runtime = runtime;
    controller.mcpServers = mcpServers;
  });
  $effect(() => {
    if (getProps().initializing) return;
    untrack(() => {
      void perform(() => controller.restore());
    });
    return () => {
      void perform(() => controller.close());
    };
  });
  $effect(() => {
    if (getProps().initializing) return;
    void controller.location;
    void controller.activeBindingId;
    void perform(() => controller.syncComposerCommands());
  });
  $effect(() => {
    return getProps().subscribeConversationMoves?.((oldPath, newPath) => {
      controller.relocateScope(oldPath, newPath);
    });
  });
  onMount(() => {
    const { app, repository, workspaceLeaf, initialLocation } = getProps();
    if (!app || !repository) return;
    const follow = (leaf?: WorkspaceLeaf | null) => {
      if (workspaceLeaf && leaf === workspaceLeaf) return;
      void perform(() =>
        controller.followDirectoryScope(conversations.directoryScope()),
      );
    };
    const activeLeaf = app.workspace.on("active-leaf-change", follow);
    let cancelled = false;
    const start = !initialLocation
      ? window.setTimeout(() => {
          if (!cancelled) follow();
        }, 0)
      : undefined;
    return () => {
      cancelled = true;
      if (start !== undefined) window.clearTimeout(start);
      app.workspace.offref(activeLeaf);
    };
  });
}
