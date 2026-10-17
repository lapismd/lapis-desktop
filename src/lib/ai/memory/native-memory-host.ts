// SPDX-License-Identifier: Apache-2.0
// Retained Lapis memory policy; see ../NOTICE.md.
import type { MemoryCapture } from "./capture-port.ts";
import type { AppDatabase } from "@lapis-notes/api/app-database";
import type { ConversationRepository } from "../conversations/conversation-repository.ts";
import type { MemoryRecordStore } from "./memory-record-store.ts";
import type { MemoryConsolidationProvider } from "./types.ts";

export type NativeMemoryServiceOptions = {
  capture?: MemoryCapture;
  now?: () => Date;
  yieldToApp?: () => Promise<void>;
  recordStore?: MemoryRecordStore;
  consolidationProvider?:
    | MemoryConsolidationProvider
    | (() => MemoryConsolidationProvider | undefined);
};

export type NativeMemoryHost = {
  repository: ConversationRepository;
  database: AppDatabase;
  now: () => Date;
  yieldToApp: () => Promise<void>;
  recordStore: MemoryRecordStore;
  consolidationProvider?: NativeMemoryServiceOptions["consolidationProvider"];
};
