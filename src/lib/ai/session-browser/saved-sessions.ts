// SPDX-License-Identifier: Apache-2.0
import type { ConversationListEntry } from "../conversations/transcript-store.ts";
import { conversationStorageKey } from "../conversations/transcript-store.ts";
import type { ConversationSnapshot } from "../conversations/types.ts";
import type { SavedSessionGroup } from "./model.ts";

/** Opaque source identities and vault scopes, rather than titles, identify saved history. */
export function savedSessionGroup(
  entry: ConversationListEntry,
): string | undefined {
  const source = entry.metadata?.imported?.source;
  return source
    ? JSON.stringify([
        entry.location.scopeDir,
        source.kind,
        source.profile,
        source.sessionKey,
      ])
    : undefined;
}

/** Metadata-only list projection. Only the currently selected immutable capture has entries. */
export function savedSessionGroups(
  rows: readonly ConversationListEntry[],
  selected: ConversationSnapshot,
): SavedSessionGroup[] {
  const groups = new Map<string, ConversationListEntry[]>();
  for (const row of rows) {
    const id = savedSessionGroup(row);
    if (!id) continue;
    const versions = groups.get(id) ?? [];
    versions.push(row);
    groups.set(id, versions);
  }
  const selectedKey = conversationStorageKey(selected.location);
  return [...groups]
    .map(([id, rows]) => {
      rows.sort(
        (a, b) =>
          a.metadata!.updatedAt.localeCompare(b.metadata!.updatedAt) ||
          conversationStorageKey(a.location).localeCompare(
            conversationStorageKey(b.location),
          ),
      );
      const latest = rows.at(-1)!;
      return {
        id,
        title: latest.metadata!.title ?? "Captured AI session",
        profile: latest.metadata!.imported!.source.profile,
        group: latest.location.scopeDir || "Vault root",
        versions: rows
          .map((row, index) => {
            const key = conversationStorageKey(row.location);
            const current = key === selectedKey;
            const incomplete =
              row.metadata!.imported!.state !== "complete" ||
              (current && selected.warnings.length > 0);
            return {
              id: key,
              sequence: index + 1,
              updatedAt: row.metadata!.updatedAt,
              incomplete,
              entries: current && !incomplete ? selected.transcript : undefined,
            };
          })
          .reverse(),
      };
    })
    .sort(
      (a, b) =>
        b.versions[0]!.updatedAt.localeCompare(a.versions[0]!.updatedAt) ||
        a.id.localeCompare(b.id),
    );
}
