// SPDX-License-Identifier: Apache-2.0
/** Tracks already-started work so its owner can drain it before resource closure. */
export class OwnedAiWork {
  readonly #pending = new Set<Promise<unknown>>();
  run<T>(operation: () => Promise<T>): Promise<T> {
    const pending = operation();
    this.#pending.add(pending);
    void pending.then(
      () => this.#pending.delete(pending),
      () => this.#pending.delete(pending),
    );
    return pending;
  }
  async settle(): Promise<void> {
    while (this.#pending.size) await Promise.allSettled([...this.#pending]);
  }
}
