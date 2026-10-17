// SPDX-License-Identifier: Apache-2.0
/** Await owned asynchronous view/controller work before closing App resources. */
export class AiOperations {
  readonly #pending = new Set<Promise<unknown>>();
  readonly #views = new Set<() => Promise<void>>();
  track<T>(operation: Promise<T>): Promise<T> {
    this.#pending.add(operation);
    void operation.then(
      () => this.#pending.delete(operation),
      () => this.#pending.delete(operation),
    );
    return operation;
  }
  ownView(close: () => Promise<void>): () => void {
    this.#views.add(close);
    return () => {
      this.#views.delete(close);
    };
  }
  async closeViews(): Promise<void> {
    const results = await Promise.allSettled(
      [...this.#views].map((close) => close()),
    );
    this.#views.clear();
    const failures = results.flatMap((result) =>
      result.status === "rejected" ? [result.reason] : [],
    );
    await this.settle();
    if (failures.length)
      throw new AggregateError(failures, "AI view cleanup failed");
  }
  async settle(): Promise<void> {
    while (this.#pending.size) await Promise.allSettled([...this.#pending]);
  }
}
