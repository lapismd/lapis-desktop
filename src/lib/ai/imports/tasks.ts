import type { App } from "@lapis-notes/api";
import { BackgroundWork } from "../../desktop/background-work.ts";
import { OwnedAiWork } from "../core/owned-work.ts";
export class ImportTasks {
  readonly #work = new OwnedAiWork();
  readonly #background: BackgroundWork;
  #closed = false;
  constructor(readonly app: App) {
    this.#background = new BackgroundWork(app.notifications, "ai-import");
  }
  run<T>(
    title: string,
    id: string,
    signal: AbortSignal,
    task: () => Promise<T>,
  ): Promise<T | undefined> {
    return this.#work.run(async () => {
      if (this.#closed || signal.aborted) return;
      try {
        const value = await this.#background.run(title, task);
        if (this.#closed || signal.aborted) return;
        await this.app.notifications.clear(id);
        return value;
      } catch (error) {
        if (!this.#closed && !signal.aborted)
          this.app.notifications.notify({
            id,
            title: "Import AI session",
            source: "ai",
            severity: "error",
            message: error instanceof Error ? error.message : String(error),
          });
      }
    });
  }
  fence() {
    this.#closed = true;
  }
  settle() {
    return this.#work.settle();
  }
}
export function importYield(signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const finish = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", finish);
      resolve();
    };
    const timer = setTimeout(finish, 16);
    signal.addEventListener("abort", finish, { once: true });
  });
}
