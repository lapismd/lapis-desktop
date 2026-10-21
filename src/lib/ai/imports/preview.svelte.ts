import type {
  AiImportSources,
  BrowserSession,
  PreviewPage,
} from "./source-port.ts";
import type {
  CapturedSession,
  SessionImportPlan,
} from "../conversations/import-types.ts";
import type { TranscriptEntry } from "../conversations/types.ts";
import type { ConversationRepository } from "../conversations/conversation-repository.ts";
import { projectImportEntries } from "../conversations/import-entries.ts";
import { validatePreview } from "./source-validation.ts";
import { ImportTasks, importYield } from "./tasks.ts";
export function createImportPreview(
  sources: AiImportSources | undefined,
  repository: ConversationRepository,
  scopeDir: string,
  tasks: ImportTasks,
) {
  let selected = $state<BrowserSession>(),
    entries = $state.raw<TranscriptEntry[]>([]),
    phase = $state<"idle" | "reading" | "ready" | "failed">("idle");
  let plan = $state<SessionImportPlan>(),
    progress = $state(0),
    paused = $state(false),
    cached = $state(false);
  let capture: CapturedSession | undefined,
    abort: AbortController | undefined,
    epoch = 0,
    active = true,
    reader: string | undefined,
    wake: (() => void) | undefined;
  const cache = new Map<string, CapturedSession>();
  const key = (row: BrowserSession) =>
    `${row.selector}/${row.updatedAt}/${row.bytes}`;
  async function select(row: BrowserSession, force = false) {
    if (!active || !sources) return;
    abort?.abort();
    wake?.();
    const current = ++epoch;
    const nextAbort = new AbortController();
    abort = nextAbort;
    const projected = new Map<string, TranscriptEntry>();
    const previousReader = reader;
    reader = undefined;
    selected = row;
    capture = undefined;
    plan = undefined;
    phase = "reading";
    paused = false;
    progress = 0;
    cached = false;
    if (!force) entries = [];
    const result = await tasks.run(
      "Preparing transcript preview",
      "ai-import-preview-failure",
      nextAbort.signal,
      async () => {
        if (previousReader)
          await sources.releasePreview(previousReader, nextAbort.signal);
        const remembered = force ? undefined : cache.get(key(row));
        let page: PreviewPage;
        if (remembered) {
          cached = true;
          page = {
            reader: "cached",
            entries: remembered.entries,
            progress: 100,
            capture: remembered,
          };
        } else
          page = validatePreview(
            await sources.startPreview(row.selector, nextAbort.signal),
          );
        while (active && !nextAbort.signal.aborted && current === epoch) {
          reader = page.capture || remembered ? undefined : page.reader;
          if (!page.capture) {
            for (const entry of projectImportEntries(page.entries))
              projected.set(entry.id, entry);
            entries = (page.order ?? []).map((id) => {
              const entry = projected.get(`import:${id}`);
              if (!entry)
                throw new Error("Incomplete progressive preview ordering");
              return entry;
            });
            const retained = new Set(entries.map((entry) => entry.id));
            for (const id of projected.keys())
              if (!retained.has(id)) projected.delete(id);
          }
          progress = page.progress;
          if (page.capture) {
            const final = await repository.imports.preview(
              page.capture,
              scopeDir,
            );
            if (!active || nextAbort.signal.aborted || current !== epoch)
              return;
            // Only a native completed snapshot can acquire a save plan.
            if (page.capture.source.kind !== row.kind)
              throw new Error("Preview source harness changed");
            capture = structuredClone(page.capture);
            plan = final;
            entries = final.entries;
            phase = "ready";
            progress = 100;
            cache.delete(key(row));
            cache.set(key(row), capture);
            while (cache.size > 4) cache.delete(cache.keys().next().value!);
            return true;
          }
          if (paused)
            await new Promise<void>((resolve) => {
              wake = resolve;
            });
          wake = undefined;
          if (!active || nextAbort.signal.aborted || current !== epoch) return;
          await importYield(nextAbort.signal);
          if (nextAbort.signal.aborted) return;
          const next = validatePreview(
            await sources.nextPreview(page.reader, nextAbort.signal),
          );
          if (next.reader !== page.reader)
            throw new Error("Preview read identity changed");
          page = next;
        }
      },
    );
    if (
      active &&
      !nextAbort.signal.aborted &&
      current === epoch &&
      result !== true
    ) {
      phase = "failed";
      plan = undefined;
      capture = undefined;
      reader = undefined;
    }
  }
  return {
    get selected() {
      return selected;
    },
    get entries() {
      return entries;
    },
    get phase() {
      return phase;
    },
    get plan() {
      return plan;
    },
    get capture() {
      return capture;
    },
    get progress() {
      return progress;
    },
    get paused() {
      return paused;
    },
    get cached() {
      return cached;
    },
    select,
    reload() {
      return selected ? select(selected, true) : Promise.resolve();
    },
    togglePause() {
      paused = !paused;
      if (!paused) wake?.();
    },
    close() {
      active = false;
      ++epoch;
      abort?.abort();
      wake?.();
      if (reader && sources) {
        const closing = new AbortController();
        void tasks.run(
          "Closing transcript preview",
          "ai-import-preview-close",
          closing.signal,
          () => sources.releasePreview(reader!, closing.signal),
        );
        reader = undefined;
      }
    },
  };
}
