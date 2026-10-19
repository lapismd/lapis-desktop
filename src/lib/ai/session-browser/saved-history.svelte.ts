// SPDX-License-Identifier: Apache-2.0
import type { App } from "@lapis-notes/api";
import type { ConversationRepository } from "../conversations/conversation-repository.ts";
import {
  conversationStorageKey,
  type ConversationListEntry,
} from "../conversations/transcript-store.ts";
import type {
  ConversationLocation,
  ConversationSnapshot,
} from "../conversations/types.ts";
import { BackgroundWork } from "../../desktop/background-work.ts";
import { OwnedAiWork } from "../core/owned-work.ts";
import { savedSessionGroup, savedSessionGroups } from "./saved-sessions.ts";

export function createSavedHistory(options: {
  app: App;
  repository: ConversationRepository;
  snapshot: ConversationSnapshot;
  onLocationChange?: (location: ConversationLocation) => void;
}) {
  const work = new OwnedAiWork();
  const background = new BackgroundWork(
    options.app.notifications,
    "ai-saved-history",
  );
  let active = true,
    listGeneration = 0,
    selectionGeneration = 0;
  let snapshot = $state.raw(options.snapshot);
  let rows = $state.raw<ConversationListEntry[]>([options.snapshot]);
  let loading = $state(false);
  const groups = $derived(savedSessionGroups(rows, snapshot));
  const failure = (cause: unknown) => {
    if (active)
      options.app.notifications.notify({
        id: "ai-saved-history-failure",
        source: "ai",
        title: "Captured AI history",
        severity: "error",
        message: cause instanceof Error ? cause.message : String(cause),
      });
  };
  const refresh = () =>
    work.run(async () => {
      if (!active) return;
      const generation = ++listGeneration;
      try {
        const next = await background.run("Loading saved AI sessions", () =>
          options.repository.listAll(),
        );
        if (!active || generation !== listGeneration) return;
        rows = next;
        await options.app.notifications.clear("ai-saved-history-failure");
      } catch (cause) {
        if (generation === listGeneration) failure(cause);
      }
    });
  const select = (id: string) =>
    work.run(async () => {
      const row = rows.find(
        (entry) => conversationStorageKey(entry.location) === id,
      );
      if (!active || !row?.metadata?.imported) return;
      const generation = ++selectionGeneration;
      loading = true;
      try {
        const next = await background.run("Opening captured AI version", () =>
          options.repository.read(row.location),
        );
        if (!active || generation !== selectionGeneration) return;
        if (!next.metadata.imported)
          throw new Error("This entry is no longer a captured snapshot.");
        snapshot = next;
        options.onLocationChange?.(next.location);
        await options.app.notifications.clear("ai-saved-history-failure");
      } catch (cause) {
        if (generation === selectionGeneration) failure(cause);
      } finally {
        if (active && generation === selectionGeneration) loading = false;
      }
    });
  return {
    get groups() {
      return groups;
    },
    get selected() {
      return savedSessionGroup(snapshot);
    },
    get selectedVersion() {
      return conversationStorageKey(snapshot.location);
    },
    get loading() {
      return loading;
    },
    refresh,
    select,
    mount() {
      const unsubscribe = options.repository.subscribe(() => void refresh());
      void refresh();
      return unsubscribe;
    },
    close() {
      active = false;
      listGeneration++;
      selectionGeneration++;
      return work.settle();
    },
  };
}
