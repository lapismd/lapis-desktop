// SPDX-License-Identifier: Apache-2.0
import type { App } from "@lapis-notes/api";
import type { ConversationRepository } from "../conversations/conversation-repository.ts";
import type { ConversationLocation } from "../conversations/types.ts";
import type { AiImportSources } from "./source-port.ts";
import { ImportTasks } from "./tasks.ts";
import { createImportBrowser } from "./browser.svelte.ts";
import { createImportPreview } from "./preview.svelte.ts";
export type AiImportProps = {
  app: App;
  repository: ConversationRepository;
  sources?: AiImportSources;
  scopeDir: string;
  initialSelector?: string;
  onOpen?: (location: ConversationLocation) => Promise<void>;
  onDispose: (pending: Promise<void>) => void;
};
export function createImportState(props: AiImportProps) {
  const tasks = new ImportTasks(props.app),
    abort = new AbortController();
  const browser = createImportBrowser(props.sources, tasks),
    preview = createImportPreview(
      props.sources,
      props.repository,
      props.scopeDir,
      tasks,
    );
  let saved = $state<{ location: ConversationLocation; duplicate: boolean }>(),
    saving = $state(false),
    active = true;
  const select = (selector: string) => {
    const row = browser.rows.find((row) => row.selector === selector);
    if (!row || !active) return Promise.resolve();
    saved = undefined;
    return preview.select(row);
  };
  async function save() {
    if (
      !active ||
      saving ||
      preview.phase !== "ready" ||
      !preview.capture ||
      !preview.plan
    )
      return;
    saving = true;
    const capture = structuredClone(preview.capture),
      selector = preview.selected?.selector;
    const result = await tasks.run(
      "Saving imported transcript",
      "ai-import-failure",
      abort.signal,
      () => props.repository.imports.save(capture, props.scopeDir),
    );
    if (active) {
      saving = false;
      if (
        result &&
        preview.selected?.selector === selector &&
        preview.capture?.source.snapshotKey === capture.source.snapshotKey
      )
        saved = {
          location: result.snapshot.location,
          duplicate: result.duplicate,
        };
    }
  }
  return {
    browser,
    get rows() {
      return browser.rows;
    },
    get busy() {
      return saving;
    },
    get loaded() {
      return browser.indexes.codex.loaded;
    },
    get selected() {
      return preview.selected?.selector;
    },
    get selectedRow() {
      return preview.selected;
    },
    get entries() {
      return preview.entries;
    },
    get plan() {
      return preview.plan;
    },
    get phase() {
      return preview.phase;
    },
    get progress() {
      return preview.progress;
    },
    get paused() {
      return preview.paused;
    },
    get cachedPreview() {
      return preview.cached;
    },
    get saved() {
      return saved;
    },
    select,
    save,
    togglePause: preview.togglePause,
    reload() {
      saved = undefined;
      return preview.reload();
    },
    async refresh() {
      await browser.refresh();
    },
    async restore(selector: string) {
      for (const folder of browser.indexes.codex.folders) {
        await browser.openFolder(folder.selector, "codex");
        if (browser.rows.some((r) => r.selector === selector)) {
          await select(selector);
          break;
        }
      }
    },
    open() {
      return tasks.run(
        "Opening imported transcript",
        "ai-import-failure",
        abort.signal,
        async () => {
          if (saved) await props.onOpen?.(saved.location);
        },
      );
    },
    async close() {
      active = false;
      abort.abort();
      browser.close();
      preview.close();
      tasks.fence();
      await tasks.settle();
    },
  };
}
export type ImportState = ReturnType<typeof createImportState>;
