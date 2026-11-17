// SPDX-License-Identifier: Apache-2.0
/** Notes-owned capture types passed to public Agent UI; never a runtime grant. */
export type SavedSessionVersion = {
  id: string;
  sequence: number;
  updatedAt: string;
  incomplete?: boolean;
  entries?: import("../conversations/types.ts").TranscriptEntry[];
};
export type SavedSessionGroup = {
  id: string;
  title: string;
  profile: string;
  group: string;
  versions: SavedSessionVersion[];
};
