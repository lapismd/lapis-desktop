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
  // Parent bootstrap objects also change when a presentation preference saves.
  // Restore only when readiness changes, never over an active live transcript.
  const ready = $derived(
    !getProps().initializing && !getProps().recordedImport,
  );
  $effect(() => {
    const { runtime, mcpServers = [] } = getProps();
    controller.runtime = runtime;
    controller.mcpServers = mcpServers;
  });
  $effect(() => {
    if (!ready) return;
    untrack(() => {
      void perform(() => controller.restore());
    });
  });
  onMount(() => {
    return () => {
      const closing = perform(() => controller.close());
      getProps().onControllerDispose?.(closing);
    };
  });
  $effect(() => {
    if (getProps().initializing || getProps().recordedImport) return;
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
