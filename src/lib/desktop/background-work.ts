import type { App, NotificationProgressHandle } from "@lapis-notes/api";
import { untrack } from "svelte";

/** App-owned status progress; the caller retains error feedback and lifetime. */
export class BackgroundWork {
  readonly #notifications: Pick<App["notifications"], "createProgress">;
  readonly #source: string;
  constructor(
    notifications: Pick<App["notifications"], "createProgress">,
    source: string,
  ) {
    this.#notifications = notifications;
    this.#source = source;
  }
  begin(title: string, message?: string): NotificationProgressHandle {
    return untrack(() =>
      this.#notifications.createProgress({
        title,
        message,
        source: this.#source,
        location: "status",
        cancellable: false,
        persistOnComplete: false,
        persistOnError: false,
      }),
    );
  }
  async run<T>(title: string, task: () => Promise<T>): Promise<T> {
    const progress = this.begin(title);
    try {
      // Progress publication and imperative task setup must not become inputs
      // of a Svelte effect that invokes this command.
      const value = await untrack(task);
      progress.complete();
      return value;
    } catch (error) {
      progress.fail(error);
      throw error;
    }
  }
  follow(
    title: string,
    controller: {
      subscribe(
        listener: (state: { busy: boolean; phase: string }) => void,
      ): () => void;
    },
  ): () => void {
    let progress: NotificationProgressHandle | undefined;
    const unsubscribe = controller.subscribe((state) => {
      if (state.busy) {
        progress ??= this.begin(title);
        progress.report({
          message:
            state.phase === "loading"
              ? "Preparing pinned repository data"
              : "Reading repository changes",
        });
      } else {
        progress?.complete();
        progress = undefined;
      }
    });
    return () => {
      unsubscribe();
      progress?.complete();
      progress = undefined;
    };
  }
}
