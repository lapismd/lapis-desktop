import type { Handle } from "@lapismd/jj-history";
import type { HistoryReader } from "./history-reader.ts";
import { HistoryLifetime } from "./history-lifetime.ts";
import { check, prepared } from "./history-selection.ts";
import { sourceLines, blameSizeReason } from "./blame-chunks.ts";
import {
  validateBlame,
  type BlameSelection,
  type BlameState,
} from "./blame-model.ts";

/** An explicit main-panel file selection owns its pin, worker progress and drain. */
export class BlameController {
  #state: BlameState = { status: "loading", busy: false };
  #listeners = new Set<(state: BlameState) => void>();
  #generation = 0;
  #abort = new AbortController();
  #handle?: Handle;
  #closed = false;
  #closing?: Promise<void>;
  readonly #lifetime: HistoryLifetime;
  readonly reader: HistoryReader;
  readonly feedback: { report(error: unknown): void; recovered(): void };
  constructor(reader: HistoryReader, feedback: BlameController["feedback"]) {
    this.reader = reader;
    this.feedback = feedback;
    this.#lifetime = new HistoryLifetime(reader);
  }
  get state() {
    return this.#state;
  }
  subscribe(listener: (state: BlameState) => void) {
    this.#listeners.add(listener);
    listener(this.#state);
    return () => {
      this.#listeners.delete(listener);
    };
  }
  #set(patch: Partial<BlameState>) {
    if (this.#closed) return;
    this.#state = { ...this.#state, ...patch };
    for (const listener of this.#listeners) listener(this.#state);
  }
  #valid(generation: number) {
    return !this.#closed && generation === this.#generation;
  }
  open(selection: BlameSelection): Promise<void> {
    if (this.#closed) return Promise.resolve();
    const generation = ++this.#generation;
    this.#abort.abort();
    const abort = (this.#abort = new AbortController());
    const prior = this.#handle;
    this.#handle = undefined;
    this.#set({
      selection,
      contents: undefined,
      progress: undefined,
      busy: true,
      status: "loading",
    });
    return this.#lifetime.run(async () => {
      try {
        if (prior) await this.#lifetime.closeHandle(prior);
        if (!this.#valid(generation)) return;
        if (!this.reader.blame)
          throw new Error("Blame is unavailable for this repository reader.");
        const handle = await this.reader.open(selection.operation);
        this.#lifetime.handles.add(handle);
        if (!this.#valid(generation)) {
          await this.#lifetime.closeHandle(handle);
          return;
        }
        this.#handle = handle;
        const snapshot = await prepared(this.reader, handle, abort.signal);
        check(snapshot.operation === selection.operation);
        const cursors = new Set<string>();
        let continuation: string | null = null;
        let file: string | undefined;
        for (let page = 0; page < 128 && this.#valid(generation); page++) {
          const reply = await this.reader.blame(handle, {
            commit: selection.commit,
            path: selection.path,
            continuation,
          });
          if (!this.#valid(generation)) return;
          const progress = validateBlame(reply, selection);
          check(progress.repository === snapshot.repository);
          if (!file) {
            file = progress.file_id;
            const response = await this.reader.read(handle, {
              kind: "file_at",
              query: { commit: selection.commit, path: selection.path, file },
            });
            if (!this.#valid(generation)) return;
            check(response.kind === "file_at");
            const contents = response.data.text;
            if (
              response.data.binary ||
              response.data.too_large ||
              typeof contents !== "string"
            )
              throw new Error("Blame requires a bounded recorded text file.");
            const reason = blameSizeReason(contents);
            if (reason) throw new Error(reason);
            check(sourceLines(contents).length === progress.line_count);
            this.#set({ contents });
          }
          check(progress.file_id === file);
          this.#set({ progress });
          if (progress.complete) {
            this.#set({ status: "ready" });
            this.feedback.recovered();
            return;
          }
          check(progress.continuation && !cursors.has(progress.continuation));
          continuation = progress.continuation;
          cursors.add(continuation);
        }
        if (this.#valid(generation))
          throw new Error(
            "Blame exceeded its bounded progress window. Refresh to try again.",
          );
      } catch (error) {
        if (this.#valid(generation)) {
          this.#set({ status: "failed" });
          this.feedback.report(error);
        }
      } finally {
        if (this.#valid(generation)) this.#set({ busy: false });
      }
    });
  }
  refresh() {
    return this.#state.selection
      ? this.open(this.#state.selection)
      : Promise.resolve();
  }
  close(): Promise<void> {
    this.#closed = true;
    this.#generation++;
    this.#abort.abort();
    this.#listeners.clear();
    return (this.#closing ??= this.#lifetime.drain().catch((error) => {
      this.#closing = undefined;
      throw error;
    }));
  }
}
