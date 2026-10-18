// SPDX-License-Identifier: Apache-2.0
/** Tracks already-started work so its owner can drain it before resource closure. */
export type AiWorkRunner = <T>(operation: () => Promise<T>) => Promise<T>;
export class OwnedAiWork {
  readonly #pending = new Set<Promise<unknown>>();
  readonly #run: AiWorkRunner;
  constructor(run: AiWorkRunner = (operation) => operation()) {
    this.#run = run;
  }
  run<T>(operation: () => Promise<T>): Promise<T> {
    const pending = this.#run(operation);
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
