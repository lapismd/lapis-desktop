// Cancellation releases a waiter; execution ownership lasts until its callback settles.
export class AppToolExecutions {
  readonly #active = new Map<string, Set<Promise<void>>>();
  run<T>(binding: string, execute: () => T | Promise<T>): Promise<T> {
    const active = this.#active.get(binding) ?? new Set<Promise<void>>();
    this.#active.set(binding, active);
    let result: Promise<T>;
    try {
      result = Promise.resolve(execute());
    } catch (error) {
      result = Promise.reject(error);
    }
    const settled = result.then(
      () => undefined,
      () => undefined,
    );
    active.add(settled);
    void settled.then(() => {
      active.delete(settled);
      if (!active.size && this.#active.get(binding) === active)
        this.#active.delete(binding);
    });
    return result;
  }
  async drain(binding: string, timeoutMs = 5_000): Promise<void> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        (async () => {
          while (this.#active.get(binding)?.size)
            await Promise.all(this.#active.get(binding)!);
        })(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () =>
              reject(
                new Error(
                  "Application tool execution has not drained; outcome is unknown.",
                ),
              ),
            timeoutMs,
          );
        }),
      ]);
    } finally {
      if (timer !== undefined) clearTimeout(timer);
    }
  }
}
