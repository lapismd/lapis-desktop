// SPDX-License-Identifier: Apache-2.0
import { onDestroy, untrack } from "svelte";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import {
  emptyDraft,
  draftThreads,
  type ConversationDraft,
} from "../../drafts/model.ts";
import { ConversationDraftStore } from "../../drafts/store.ts";
import {
  normalizeConversationLocation,
  normalizeConversationScope,
} from "../../conversations/paths.ts";
import type { ConversationLocation } from "../../conversations/types.ts";
import { relocateConversationLocation } from "../../conversations/conversation-locator.ts";
import type { AiChatController } from "../chat-controller.svelte.ts";
import type { AiChatPanelProps } from "./props.ts";
import type { ComposerState } from "./composer.svelte.ts";
import type { AttachmentsState } from "./attachments.svelte.ts";
const locationKey = (location: ConversationLocation) => {
  const normalized = normalizeConversationLocation(location);
  return JSON.stringify([normalized.scopeDir, normalized.conversationId]);
};
export function observeConversationDraft(
  props: () => AiChatPanelProps,
  controller: AiChatController,
  composer: ComposerState,
  attachments: AttachmentsState,
) {
  const store = untrack(() => props().drafts ?? new ConversationDraftStore());
  const notices = untrack(() => {
    const app = props().app;
    return app
      ? getWorkspaceHostBinding(app.workspace).controller.notifications
      : undefined;
  });
  const leafId = untrack(
    () => props().workspaceLeaf?.id ?? crypto.randomUUID(),
  );
  const retained = new Map<string, ConversationDraft>();
  let active = "",
    writable = false,
    generation = 0,
    timer: ReturnType<typeof setTimeout> | undefined;
  let adoptTarget = "",
    disposed = false,
    notified = false;
  const snapshot = (): ConversationDraft => ({
    text: composer.draft,
    attachments: $state.snapshot(attachments.attachments),
    threads: draftThreads($state.snapshot(composer.draftThreads)),
  });
  const report = (error: unknown) => {
    if (notified) return;
    notified = true;
    notices?.notify({
      id: "ai-draft-storage",
      source: "ai",
      severity: "error",
      title: "Conversation draft",
      duration: 0,
      message: error instanceof Error ? error.message : String(error),
    });
  };
  const save = (key: string, value: ConversationDraft) => {
    retained.set(key, value);
    if (!writable) return;
    const work = Promise.resolve()
      .then(() => store.save(key, value))
      .then(() => {
        if (notified) void notices?.clear("ai-draft-storage");
        notified = false;
      })
      .catch(report);
    props().onOperation?.(work);
  };
  const flush = () => {
    clearTimeout(timer);
    if (active && composer.draftReady) save(active, snapshot());
  };
  composer.adoptDraft = (location) => {
    adoptTarget = locationKey(location);
  };
  $effect(() =>
    props().subscribeConversationMoves?.((oldPath, newPath) => {
      if (!controller.location) return;
      const relocated = relocateConversationLocation(
        controller.location,
        oldPath,
        newPath,
      );
      if (relocated) adoptTarget = locationKey(relocated);
    }),
  );
  $effect.pre(() => {
    const location = controller.location;
    const next = location
      ? locationKey(location)
      : JSON.stringify([
          "new",
          leafId,
          normalizeConversationScope(controller.directoryContext),
        ]);
    untrack(() => {
      if (next === active) return;
      const previous = active,
        carry = !!previous && adoptTarget === next;
      const carried = carry ? snapshot() : undefined;
      flush();
      const request = ++generation;
      active = next;
      composer.draftOriginKey = carry ? previous : "";
      composer.draftKey = next;
      composer.draftReady = false;
      composer.draft = "";
      composer.draftThreads = [];
      attachments.attachments = [];
      attachments.attachOpen = false;
      attachments.drawerCollapsed = false;
      composer.recipients.remove();
      writable = false;
      adoptTarget = "";
      const loading = (async () => {
        try {
          const value =
            carried ?? retained.get(next) ?? (await store.read(next));
          if (disposed || request !== generation) return;
          writable = true;
          composer.draft = value.text;
          composer.draftThreads = value.threads;
          attachments.attachments = value.attachments;
          composer.draftReady = true;
          if (carried) {
            save(next, carried);
            save(previous, emptyDraft());
          }
        } catch (error) {
          if (disposed || request !== generation) return;
          // Keep editing paused; never overwrite unreadable data with an empty draft.
          report(error);
        }
      })();
      props().onOperation?.(loading);
    });
  });
  $effect(() => {
    const key = composer.draftKey,
      ready = composer.draftReady;
    const value = snapshot();
    if (!ready || key !== active) return;
    clearTimeout(timer);
    timer = setTimeout(() => save(key, value), 250);
    return () => clearTimeout(timer);
  });
  onDestroy(() => {
    flush();
    disposed = true;
    generation++;
  });
}
