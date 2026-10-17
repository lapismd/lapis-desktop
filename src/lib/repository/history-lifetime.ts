import type { Handle } from "@lapismd/jj-history";
import type { HistoryReader } from "./history-reader.ts";

/** Ephemeral handles remain owned until either close or full host release confirms. */
export class HistoryLifetime {
  readonly pending = new Set<Promise<unknown>>();
  readonly handles = new Set<Handle>();
  readonly closing = new Map<Handle, Promise<void>>();
  readonly reader: HistoryReader;
  constructor(reader: HistoryReader) {
    this.reader = reader;
  }
  run(action: () => Promise<void>): Promise<void> {
    const job = action();
    this.pending.add(job);
    void job.finally(() => this.pending.delete(job)).catch(() => {});
    return job;
  }
  closeHandle(handle: Handle): Promise<void> {
    const retained = this.closing.get(handle);
    if (retained) return retained;
    const job = this.reader.close(handle).then(() => {
      this.handles.delete(handle);
    });
    this.closing.set(handle, job);
    void job.finally(() => this.closing.delete(handle)).catch(() => {});
    return job;
  }
  async drain(): Promise<void> {
    const known = new Set(this.handles);
    // Native close cancels pending reads before draining their workers.
    const closing = Promise.allSettled(
      [...known].map((handle) => this.closeHandle(handle)),
    );
    while (this.pending.size) await Promise.allSettled([...this.pending]);
    const late = await Promise.allSettled(
      [...this.handles]
        .filter((handle) => !known.has(handle))
        .map((handle) => this.closeHandle(handle)),
    );
    const failures = [...(await closing), ...late].flatMap((result) =>
      result.status === "rejected" ? [result.reason] : [],
    );
    if (failures.length)
      throw new AggregateError(failures, "Repository history cleanup failed");
  }
}
