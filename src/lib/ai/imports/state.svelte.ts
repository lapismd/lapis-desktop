// SPDX-License-Identifier: Apache-2.0
import type { App } from "@lapis-notes/api";
import type { ConversationRepository } from "../conversations/conversation-repository.ts";
import type {
  CapturedSession,
  SessionImportPlan,
} from "../conversations/import-types.ts";
import type { ConversationLocation } from "../conversations/types.ts";
import type { AiImportSources, ImportSourceRow } from "./source-port.ts";
import { validateImportRows } from "./source-port.ts";
import { BackgroundWork } from "../../desktop/background-work.ts";
import { OwnedAiWork } from "../core/owned-work.ts";

export type AiImportProps = {
  app: App;
  repository: ConversationRepository;
  sources?: AiImportSources;
  scopeDir: string;
  onOpen?: (location: ConversationLocation) => Promise<void>;
  onDispose: (pending: Promise<void>) => void;
};
export function createImportState(props: AiImportProps) {
  const work = new OwnedAiWork(),
    background = new BackgroundWork(props.app.notifications, "ai-import");
  const abort = new AbortController();
  let active = true,
    capture: CapturedSession | undefined;
  let rows = $state<ImportSourceRow[]>([]),
    busy = $state(false),
    loaded = $state(false);
  let selected = $state<string>(),
    plan = $state<SessionImportPlan>();
  let saved = $state<{ location: ConversationLocation; duplicate: boolean }>();
  function run(title: string, task: () => Promise<void>) {
    return work.run(async () => {
      if (!active || busy) return;
      busy = true;
      try {
        await background.run(title, task);
        if (active) await props.app.notifications.clear("ai-import-failure");
      } catch (error) {
        if (active && !abort.signal.aborted)
          props.app.notifications.notify({
            id: "ai-import-failure",
            title: "Import AI session",
            source: "ai",
            severity: "error",
            message: error instanceof Error ? error.message : String(error),
          });
      } finally {
        if (active) busy = false;
      }
    });
  }
  const refresh = () =>
    run("Finding importable AI sessions", async () => {
      if (!props.sources) return;
      const next = await props.sources.list(abort.signal);
      if (!active) return;
      rows = validateImportRows(next);
      loaded = true;
    });
  const select = (selector: string) =>
    run("Preparing transcript preview", async () => {
      if (!props.sources || !rows.some((r) => r.selector === selector)) return;
      // Keep an earlier successful preview until its replacement is confirmed.
      const next = await props.sources.preview(selector, abort.signal);
      const preview = await props.repository.imports.preview(
        next,
        props.scopeDir,
      );
      if (!active) return;
      capture = structuredClone(next);
      plan = preview;
      selected = selector;
      saved = undefined;
    });
  const save = () =>
    run("Saving imported transcript", async () => {
      if (!capture || !plan) return;
      const result = await props.repository.imports.save(
        capture,
        props.scopeDir,
      );
      if (!active) return;
      saved = {
        location: result.snapshot.location,
        duplicate: result.duplicate,
      };
    });
  const open = () =>
    run("Opening imported transcript", async () => {
      if (saved) await props.onOpen?.(saved.location);
    });
  return {
    get rows() {
      return rows;
    },
    get busy() {
      return busy;
    },
    get loaded() {
      return loaded;
    },
    get selected() {
      return selected;
    },
    get plan() {
      return plan;
    },
    get saved() {
      return saved;
    },
    refresh,
    select,
    save,
    open,
    close() {
      active = false;
      abort.abort();
      return work.settle();
    },
  };
}
