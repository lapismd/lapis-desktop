// SPDX-License-Identifier: Apache-2.0
// Retained Lapis AI Catalog; see ../NOTICE.md.
import type { App } from "@lapis-notes/api";
import type { CatalogGroup, CatalogToolRow } from "./types.ts";
export type AiCatalogProps = {
  app: App;
  loadCatalog: () => Promise<CatalogGroup[]>;
  onToggleTool: (tool: CatalogToolRow, enabled: boolean) => Promise<void>;
  onOpenSkill: (path: string) => Promise<void>;
  subscribeSettings?: (listener: () => void) => () => void;
  subscribeUserCommands?: (listener: () => void) => () => void;
  onDispose?: (pending: Promise<void>) => void;
};
