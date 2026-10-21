import type {
  AiImportSources,
  ImportSourceRow,
} from "../../../../src/lib/ai/imports/source-port.ts";
import { sampleCapture } from "./sample-capture.ts";
export type ImportScenario =
  | "streaming"
  | "ready"
  | "loading"
  | "empty"
  | "unavailable"
  | "failure"
  | "save-failure"
  | "saved";

export function createImportSources(scenario: ImportScenario): AiImportSources {
  let fail = scenario === "failure";
  const legacy = {
    list: async (signal: AbortSignal): Promise<ImportSourceRow[]> => {
      if (scenario === "loading")
        return new Promise((resolve) =>
          signal.addEventListener("abort", () => resolve([]), { once: true }),
        );
      return scenario === "empty"
        ? []
        : [
            {
              selector: "opaque-codex-1",
              title: "Weekly review",
              profile: "Codex CLI",
              updatedAt: "2026-10-19T09:00:08.000Z",
            },
            {
              selector: "opaque-codex-2",
              title: "Research note links",
              profile: "Codex Desktop",
              updatedAt: "2026-10-18T16:20:00.000Z",
            },
          ];
    },
    preview: async (selector: string) => {
      if (fail) {
        fail = false;
        throw new Error(
          "The selected source changed. Preview it again to read its current snapshot.",
        );
      }
      const capture = structuredClone(sampleCapture);
      if (selector.endsWith("2")) {
        capture.source.sessionKey = "c".repeat(64);
        capture.source.profile = "codex-desktop-0.159.2";
      }
      return capture;
    },
  };
  const kinds = ["codex", "cursor", "opencode"] as const;
  const readers = new Map<
    string,
    { capture: typeof sampleCapture; page: number }
  >();
  const wait = (signal: AbortSignal) =>
    new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, 700);
      signal.addEventListener(
        "abort",
        () => {
          clearTimeout(timer);
          resolve();
        },
        { once: true },
      );
    });
  const folder = {
    selector: "review-folder",
    label: "Notes",
    location: "~/Notes",
    count: 2,
  };
  const sources: AiImportSources = {
    folders: async (kind, _refresh, signal) => ({
      folders:
        scenario === "empty"
          ? []
          : (await legacy.list(signal),
            [{ ...folder, selector: `${kind}-folder` }]),
      indexed: scenario === "empty" ? 0 : 2,
      complete: true,
      limited: false,
    }),
    sessions: async (selectedFolder, _after, signal) => {
      const kind = kinds.find((kind) => selectedFolder === `${kind}-folder`)!;
      return {
        rows: (await legacy.list(signal)).map((row) => ({
          ...row,
          selector: row.selector.replace("codex", kind),
          kind,
          profile:
            kind === "codex"
              ? row.profile
              : kind === "cursor"
                ? "cursor-jsonl-v1"
                : "opencode-sqlite-v1",
          folder: selectedFolder,
          bytes: 1024,
        })),
        next: null,
        total: 2,
      };
    },
    startPreview: async (selector) => {
      const capture = await legacy.preview(selector);
      const kind = kinds.find((kind) => selector.includes(kind))!;
      if (kind !== "codex") {
        capture.source.kind = kind;
        capture.source.profile =
          kind === "cursor" ? "cursor-jsonl-v1" : "opencode-sqlite-v1";
        capture.source.sessionKey = (kind === "cursor" ? "d" : "e").repeat(64);
      }
      if (scenario === "streaming") {
        const reader = `read:${selector}`;
        readers.set(reader, { capture, page: 1 });
        return {
          reader,
          entries: capture.entries.slice(0, 1),
          order: capture.entries.slice(0, 1).map((e) => e.id),
          progress: 25,
        };
      }
      return {
        reader: `read:${selector}`,
        entries: capture.entries,
        progress: 100,
        capture,
      };
    },
    nextPreview: async (reader, signal) => {
      await wait(signal);
      const read = readers.get(reader);
      if (!read || signal.aborted) throw new Error("Read cancelled");
      read.page++;
      if (read.page >= 4) {
        readers.delete(reader);
        return { reader, entries: [], progress: 100, capture: read.capture };
      }
      const count = Math.min(read.page, read.capture.entries.length);
      return {
        reader,
        entries: read.capture.entries.slice(0, count),
        order: read.capture.entries.slice(0, count).map((e) => e.id),
        progress: read.page * 25,
      };
    },
    releasePreview: async (reader) => {
      readers.delete(reader);
    },
  };
  return sources;
}
