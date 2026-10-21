import { folders, sessions, transcript, type Session } from "./data.ts";
import type { TranscriptEntry } from "../../../../src/lib/ai/conversations/types.ts";

export type Scenario =
  | "browse"
  | "streaming"
  | "cached"
  | "empty"
  | "changed"
  | "indexing";
/** Disposable UI simulation. No native source, provider or import store is called. */
export class ImportBrowserReview {
  indexing = $state(false);
  expanded = $state(true);
  collapsed = $state.raw(
    new Set(["Projects/Lapis Notes", "Projects/Design Core", "Archive"]),
  );
  folder = $state("");
  folderLoading = $state(false);
  cache = $state.raw<Record<string, Session[]>>({});
  selected = $state<Session>();
  entries = $state.raw<TranscriptEntry[]>([]);
  phase = $state<"idle" | "reading" | "ready" | "changed">("idle");
  paused = $state(false);
  cachedPreview = $state(false);
  imported = $state(false);
  loads = 0;
  reads = 0;
  cancelled = 0;
  #epoch = 0;
  #closed = false;
  #folderTimer?: ReturnType<typeof setTimeout>;
  #streamTimer?: ReturnType<typeof setTimeout>;
  #indexTimer?: ReturnType<typeof setTimeout>;
  #previews = new Map<string, TranscriptEntry[]>();
  constructor(
    readonly scenario: Scenario,
    readonly automatic = true,
  ) {
    this.indexing = scenario === "indexing";
    if (["streaming", "cached", "changed"].includes(scenario)) {
      this.folder = folders[0].path;
      this.cache = {
        [this.folder]: sessions.filter((s) => s.folder === this.folder),
      };
      this.collapsed = new Set(["Projects/Design Core", "Archive"]);
      if (scenario === "cached")
        this.#previews.set("weekly", transcript(sessions[0]));
      this.select(sessions[0]);
      if (scenario === "changed") this.changeSource();
    }
    if (scenario === "empty") {
      this.folder = folders[2].path;
      this.cache = { [this.folder]: [] };
      this.collapsed = new Set([
        "Projects/Lapis Notes",
        "Projects/Design Core",
      ]);
    }
  }
  start() {
    if (this.indexing && this.automatic)
      this.#indexTimer = setTimeout(() => this.finishIndex(), 1600);
    this.schedule();
  }
  finishIndex() {
    this.indexing = false;
  }
  toggle(path: string) {
    const next = new Set(this.collapsed);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    this.collapsed = next;
    if (!next.has(path) && folders.some((folder) => folder.path === path)) {
      if (this.folder !== path) {
        clearTimeout(this.#folderTimer);
        this.folderLoading = false;
      }
      this.folder = path;
      if (!(path in this.cache)) this.loadFolder();
    }
  }
  loadFolder() {
    clearTimeout(this.#folderTimer);
    this.folderLoading = true;
    this.loads++;
    const path = this.folder;
    if (this.automatic)
      this.#folderTimer = setTimeout(() => this.finishFolder(path), 900);
  }
  finishFolder(path = this.folder) {
    if (this.#closed) return;
    this.cache = {
      ...this.cache,
      [path]: sessions.filter((s) => s.folder === path),
    };
    if (path === this.folder) this.folderLoading = false;
  }
  select(session: Session) {
    if (this.phase === "reading") this.cancelled++;
    this.#epoch++;
    clearTimeout(this.#streamTimer);
    this.selected = session;
    this.paused = false;
    this.imported = false;
    const cached = this.#previews.get(session.id);
    this.cachedPreview = !!cached;
    this.entries = cached ?? transcript(session).slice(0, 2);
    this.phase = cached ? "ready" : "reading";
    if (!cached) this.reads++;
    this.schedule();
  }
  private schedule() {
    clearTimeout(this.#streamTimer);
    if (
      !this.automatic ||
      this.paused ||
      this.phase !== "reading" ||
      this.#closed
    )
      return;
    const epoch = this.#epoch;
    this.#streamTimer = setTimeout(() => this.receive(epoch), 1800);
  }
  receive(epoch: number) {
    if (epoch !== this.#epoch || this.#closed || this.phase !== "reading")
      return;
    this.advance();
  }
  advance() {
    if (!this.selected || this.phase !== "reading") return;
    const all = transcript(this.selected);
    this.entries = all.slice(0, this.entries.length + 1);
    if (this.entries.length === all.length) {
      this.phase = "ready";
      this.#previews.set(this.selected.id, this.entries);
    }
    this.schedule();
  }
  complete() {
    while (this.phase === "reading") this.advance();
  }
  togglePause() {
    this.paused = !this.paused;
    this.schedule();
  }
  changeSource() {
    this.#epoch++;
    clearTimeout(this.#streamTimer);
    if (this.selected) this.#previews.delete(this.selected.id);
    this.phase = "changed";
  }
  reload() {
    if (this.selected) {
      this.#previews.delete(this.selected.id);
      this.select(this.selected);
    }
  }
  get epoch() {
    return this.#epoch;
  }
  get progress() {
    return Math.round((this.entries.length / 6) * 100);
  }
  get files() {
    return Object.values(this.cache).flat();
  }
  close() {
    this.#closed = true;
    this.#epoch++;
    clearTimeout(this.#folderTimer);
    clearTimeout(this.#streamTimer);
    clearTimeout(this.#indexTimer);
  }
}
