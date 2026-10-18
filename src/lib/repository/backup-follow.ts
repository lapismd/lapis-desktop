import type { BackupController } from "./backup.ts";
/** Coalesce captures while retaining independent, explicitly pinned views. */
export function followBackup(
  backup: BackupController | undefined,
  controller: { checkpointChanged(operation: string): Promise<void> },
) {
  let closed = false,
    running = false;
  let next: string | undefined;
  const dispose = backup?.subscribe((state) => {
    if (state.phase !== "ready" || !state.checkpoint) return;
    next = state.checkpoint.operation;
    if (!running) void drain();
  });
  async function drain() {
    running = true;
    try {
      while (!closed && next) {
        const operation = next;
        next = undefined;
        await controller.checkpointChanged(operation);
      }
    } finally {
      running = false;
    }
  }
  return () => {
    closed = true;
    dispose?.();
  };
}
