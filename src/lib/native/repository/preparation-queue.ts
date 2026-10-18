import type { Handle, HistoryClient } from "@lapismd/jj-history";
import { pause } from "../../repository/history-selection.ts";
type Preparation = { handle: Handle; closing?: Promise<void> };

/** The native host deliberately admits only one preparation job at a time. */
export class PreparationQueue {
  readonly #reader: HistoryClient;
  readonly #abort = new AbortController();
  #tail: Promise<unknown> = Promise.resolve();
  #previous?: Preparation;
  constructor(reader: HistoryClient) {
    this.#reader = reader;
  }
  open(operation: string): Promise<Handle> {
    const job = this.#tail.then(async () => {
      this.#abort.signal.throwIfAborted();
      const previous = this.#previous;
      if (previous) await this.#available(previous);
      this.#abort.signal.throwIfAborted();
      const handle = await this.#reader.open(operation);
      this.#previous = { handle };
      return handle;
    });
    this.#tail = job.catch(() => {});
    return job;
  }
  close(handle: Handle): Promise<void> {
    const job = this.#reader.close(handle);
    if (this.#previous?.handle === handle) this.#previous.closing = job;
    return job;
  }
  stop(): void {
    this.#abort.abort(new Error("Repository history is closed"));
  }
  async #available(previous: Preparation): Promise<void> {
    for (let attempt = 0; attempt < 100; attempt++) {
      this.#abort.signal.throwIfAborted();
      if (previous.closing) return previous.closing;
      try {
        const status = await this.#reader.status(previous.handle);
        if (previous.closing) return previous.closing;
        if (status.state !== "preparing") return;
      } catch (error) {
        if (previous.closing) return previous.closing;
        throw error;
      }
      await pause(this.#abort.signal);
    }
    throw new Error(
      "Repository preparation is still running; try again shortly",
    );
  }
}
