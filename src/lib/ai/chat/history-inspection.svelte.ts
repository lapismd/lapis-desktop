import type { LocalFileDiffChange } from "@lapismd/jj-history";
import type {
  AiTurnRecord,
  AiUndoRequest,
} from "../../repository/ai-history.ts";
import type { AiFileHistory } from "./file-history.svelte.ts";
import {
  readTurnComparison,
  readTurnFile,
  type TurnComparison,
} from "./history-comparison.ts";

export class AiHistoryInspection {
  open = $state(false);
  scope = $state<"turn" | "conversation">("turn");
  record = $state.raw<AiTurnRecord>();
  comparison = $state.raw<TurnComparison>();
  path = $state<string>();
  diff = $state.raw<LocalFileDiffChange>();
  loading = $state(false);
  unavailable = $state(false);
  selected = $state.raw<string[]>([]);
  undo = $state.raw<AiUndoRequest>();
  undoBusy = $state(false);
  recoveringUndo = $state(false);
  #epoch = 0;
  #file = 0;
  #closed = false;
  #cache = new Map<string, Promise<TurnComparison>>();
  constructor(readonly history: AiFileHistory) {}
  async recoverUndo(conversation: string) {
    const epoch = this.#epoch;
    const binding = this.history.binding;
    if (!binding?.enabled()) return;
    try {
      const pending = await binding.service.pendingUndo();
      if (!this.#closed && epoch === this.#epoch) {
        this.undo = pending.find(
          (request) => request.conversation === conversation,
        );
        this.recoveringUndo = !!this.undo;
      }
    } catch (error) {
      this.history.report(error);
    }
  }
  summary(record: AiTurnRecord) {
    const key = JSON.stringify([
      record.context.turn,
      record.before.commit,
      record.after?.commit,
    ]);
    let job = this.#cache.get(key);
    if (!job) {
      const binding = this.history.binding;
      if (!binding)
        return Promise.reject(new Error("Repository History is unavailable."));
      job = readTurnComparison(binding, record);
      this.#cache.set(key, job);
      void job.catch(() => this.#cache.delete(key));
      if (this.#cache.size > 8)
        this.#cache.delete(this.#cache.keys().next().value!);
    }
    return job;
  }
  async show(record: AiTurnRecord, path?: string) {
    const epoch = ++this.#epoch;
    this.#file++;
    this.record = record;
    this.comparison = undefined;
    this.diff = undefined;
    this.path = undefined;
    this.selected = [];
    this.open = true;
    this.loading = true;
    this.unavailable = false;
    try {
      const summary = await this.summary(record);
      if (this.#closed || epoch !== this.#epoch) return;
      this.comparison = summary;
      if (path) await this.select(path);
    } catch (error) {
      if (epoch === this.#epoch && !this.#closed) {
        this.unavailable = true;
        this.history.report(error);
      }
    } finally {
      if (epoch === this.#epoch) this.loading = false;
    }
  }
  async select(path: string) {
    const epoch = this.#epoch,
      file = ++this.#file,
      record = this.record;
    const item = this.comparison?.files.find((f) => f.path === path);
    if (!item || !record || !this.history.binding) return;
    this.path = path;
    this.diff = undefined;
    try {
      const diff =
        item.diff ?? (await readTurnFile(this.history.binding, record, path));
      if (!this.#closed && epoch === this.#epoch && file === this.#file)
        this.diff = diff;
    } catch (error) {
      if (epoch === this.#epoch && file === this.#file)
        this.history.report(error);
    }
  }
  async previewUndo(record: AiTurnRecord, paths: string[] = []) {
    const binding = this.history.binding;
    if (!binding || this.undoBusy) return;
    this.undoBusy = true;
    try {
      const preview = await binding.guard(() =>
        binding.service.previewUndo(
          record.context.conversation,
          record.context.turn,
          paths,
        ),
      );
      this.recoveringUndo = false;
      this.undo = {
        ...preview,
        request_id: crypto.randomUUID(),
        conversation: record.context.conversation,
        turn: record.context.turn,
      };
    } catch (error) {
      this.history.report(error);
    } finally {
      this.undoBusy = false;
    }
  }
  async applyUndo() {
    const request = this.undo,
      binding = this.history.binding;
    if (!request || !binding || this.undoBusy) return;
    this.undoBusy = true;
    try {
      await binding.guard(() => binding.service.undo(request));
      this.undo = undefined;
    } catch (error) {
      this.history.report(error);
    } finally {
      this.undoBusy = false;
    }
  }
  closeFile() {
    this.#file++;
    this.path = undefined;
    this.diff = undefined;
  }
  reset() {
    this.#epoch++;
    this.#file++;
    this.open = false;
    this.record = undefined;
    this.comparison = undefined;
    this.diff = undefined;
    this.path = undefined;
    this.undo = undefined;
    this.recoveringUndo = false;
  }
  async dispose() {
    this.#closed = true;
    this.reset();
    await Promise.allSettled(this.#cache.values());
    this.#cache.clear();
  }
}
