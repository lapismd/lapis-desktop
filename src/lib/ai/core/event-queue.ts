// SPDX-License-Identifier: Apache-2.0
// Adapted from the AI plugin's event queue with bounded pending delivery.
export class AsyncEventQueue<T> implements AsyncIterable<T> {
  readonly #values: T[] = [];
  readonly #waiters: Array<(result: IteratorResult<T>) => void> = [];
  readonly #limit: number;
  #closed = false;
  constructor(limit = 256) {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 4096)
      throw new Error("Invalid AI event queue limit");
    this.#limit = limit;
  }
  push(value: T): boolean {
    if (this.#closed) return false;
    const waiter = this.#waiters.shift();
    if (waiter) {
      waiter({ value, done: false });
      return true;
    }
    if (this.#values.length >= this.#limit) {
      this.close();
      throw new Error("AI event coverage lost");
    }
    this.#values.push(value);
    return true;
  }
  close(): void {
    if (this.#closed) return;
    this.#closed = true;
    while (this.#waiters.length)
      this.#waiters.shift()!({ value: undefined, done: true });
  }
  async *[Symbol.asyncIterator](): AsyncIterator<T> {
    while (true) {
      if (this.#values.length) {
        yield this.#values.shift() as T;
        continue;
      }
      if (this.#closed) return;
      const next = await new Promise<IteratorResult<T>>((resolve) =>
        this.#waiters.push(resolve),
      );
      if (next.done) return;
      yield next.value;
    }
  }
}
