// SPDX-License-Identifier: Apache-2.0
// Retained Lapis chat presentation state; see ../../NOTICE.md.
import { runChatAction } from "./action-errors.ts";
import type { ComposerTriggerItem } from "@lapismd/design-core/ai/chat";
import type { AiChatController } from "../chat-controller.svelte.ts";
import type { AiChatPanelProps } from "./props.ts";
class AttachmentsPanelState {
  attachments = $state<
    {
      path: string;
      name: string;
    }[]
  >([]);
  drawerCollapsed = $state(false);
  drawerHost = $state<HTMLDivElement | null>(null);
  visibleInteractionId = $state<string | null>(null);
  attachOpen = $state(false);
  attachItems = $state<ComposerTriggerItem[]>([]);
  attachSideOffset = $derived.by(() => {
    void this.attachments.length;
    void this.drawerCollapsed;
    if (!this.drawerHost) return 8;
    const height = this.drawerHost.getBoundingClientRect().height;
    return height > 0 ? Math.round(height) + 8 : 8;
  });
  pendingInteraction = $derived.by(() => {
    for (let index = this.controller.items.length - 1; index >= 0; index -= 1) {
      const item = this.controller.items[index];
      if (
        (item?.type === "approval" || item?.type === "question") &&
        item.status === "pending"
      ) {
        return item;
      }
    }
    return undefined;
  });

  constructor(
    private readonly getProps: () => AiChatPanelProps,
    private readonly controller: AiChatController,
  ) {
    this.addAttachment = this.addAttachment.bind(this);
    this.removeAttachment = this.removeAttachment.bind(this);
    this.loadVaultFiles = this.loadVaultFiles.bind(this);
    this.onAttachOpenChange = this.onAttachOpenChange.bind(this);
    $effect(() => {
      const requestId = this.pendingInteraction?.request.id ?? null;
      if (requestId && requestId !== this.visibleInteractionId) {
        this.visibleInteractionId = requestId;
        this.drawerCollapsed = false;
      }
      if (!requestId) this.visibleInteractionId = null;
    });
  }
  addAttachment(item: ComposerTriggerItem): void {
    const path = item.id;
    if (!path || this.attachments.some((file) => file.path === path)) {
      this.attachOpen = false;
      return;
    }
    this.attachments = [
      ...this.attachments,
      { path, name: item.label || path },
    ];
    this.drawerCollapsed = false;
    this.attachOpen = false;
  }
  removeAttachment(path: string): void {
    this.attachments = this.attachments.filter((file) => file.path !== path);
  }
  async loadVaultFiles(): Promise<void> {
    const { fileSearch } = this.getProps();

    if (!fileSearch) {
      this.attachItems = [];
      return;
    }
    this.attachItems = await fileSearch("", new AbortController().signal);
  }
  onAttachOpenChange(open: boolean): void {
    this.attachOpen = open;
    if (open) {
      void runChatAction(this.getProps, this.controller, () =>
        this.loadVaultFiles(),
      );
      return;
    }
    this.attachItems = [];
  }
}
export function createAttachmentsState(
  getProps: () => AiChatPanelProps,
  controller: AiChatController,
) {
  return new AttachmentsPanelState(getProps, controller);
}
export type AttachmentsState = AttachmentsPanelState;
