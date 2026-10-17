// SPDX-License-Identifier: Apache-2.0
// Retained Lapis AI History; see ../NOTICE.md.
import type { ConversationRepository } from "../conversations/conversation-repository.ts";
import type { ConversationListEntry } from "../conversations/transcript-store.ts";
import { entryKey } from "./entry.ts";
export async function loadHistoryEntries(
  repository: ConversationRepository,
  query: string,
  searchAllConversations: (query: string) => Promise<ConversationListEntry[]>,
): Promise<ConversationListEntry[]> {
  function matchesFolderLabel(
    entry: ConversationListEntry,
    normalizedQuery: string,
  ): boolean {
    const scope = entry.location.scopeDir.toLocaleLowerCase();
    const title = entry.metadata?.title?.toLocaleLowerCase() ?? "";
    return scope.includes(normalizedQuery) || title.includes(normalizedQuery);
  }

  async function matchLocalConversation(
    entry: ConversationListEntry,
    normalizedQuery: string,
  ): Promise<ConversationListEntry | null> {
    if (matchesFolderLabel(entry, normalizedQuery)) return entry;
    if (entry.unavailableReason) return null;
    try {
      const snapshot = await repository.read(entry.location);
      const searchable = snapshot.transcript.flatMap((item): string[] => {
        if (item.type === "message" || item.type === "thinking.summary") {
          return [item.text];
        }
        if (item.type === "tool") {
          return [item.name, ...(item.input ? [item.input] : [])];
        }
        return [];
      });
      const preview = searchable.find((value) =>
        value.toLocaleLowerCase().includes(normalizedQuery),
      );
      return preview ? { ...entry, preview } : null;
    } catch {
      return null;
    }
  }

  function mergeLocalEntries(
    indexedEntries: ConversationListEntry[],
    localEntries: ConversationListEntry[],
    authoritativeEntries = localEntries,
  ): ConversationListEntry[] {
    const localByKey = new Map(
      authoritativeEntries.map((entry) => [entryKey(entry), entry]),
    );
    const merged = new Map(
      indexedEntries
        .filter((entry) => localByKey.has(entryKey(entry)))
        .map((entry) => [
          entryKey(entry),
          {
            ...localByKey.get(entryKey(entry))!,
            ...(entry.preview ? { preview: entry.preview } : {}),
          },
        ]),
    );
    for (const entry of localEntries) {
      const indexed = merged.get(entryKey(entry));
      merged.set(entryKey(entry), {
        ...indexed,
        ...entry,
        ...(indexed?.preview ? { preview: indexed.preview } : {}),
      });
    }
    return [...merged.values()];
  }

  async function loadEntries(): Promise<ConversationListEntry[]> {
    const localEntries = await repository.listAll();
    const trimmed = query.trim();
    if (!trimmed) {
      try {
        return mergeLocalEntries(
          await searchAllConversations(""),
          localEntries,
        );
      } catch {
        return localEntries;
      }
    }

    const normalizedQuery = trimmed.toLocaleLowerCase();
    const localMatches = (
      await Promise.all(
        localEntries.map((entry) =>
          matchLocalConversation(entry, normalizedQuery),
        ),
      )
    ).filter((entry): entry is ConversationListEntry => Boolean(entry));
    let matches: ConversationListEntry[];
    let allEntries: ConversationListEntry[];
    try {
      [matches, allEntries] = await Promise.all([
        searchAllConversations(trimmed),
        searchAllConversations(""),
      ]);
    } catch {
      return localMatches;
    }
    const merged = new Map(matches.map((entry) => [entryKey(entry), entry]));
    for (const entry of allEntries) {
      if (
        matchesFolderLabel(entry, normalizedQuery) &&
        !merged.has(entryKey(entry))
      ) {
        merged.set(entryKey(entry), entry);
      }
    }
    return mergeLocalEntries([...merged.values()], localMatches, localEntries);
  }

  return loadEntries();
}
