import type { Handle, LocalCodeSnapshot } from "@lapismd/jj-history";
import type { HistoryReader } from "./history-reader.ts";

export function check(condition: unknown): asserts condition {
  if (!condition)
    throw new Error("Repository history returned a different selection");
}
export function pause(signal: AbortSignal): Promise<void> {
  if (signal.aborted) return Promise.reject(signal.reason);
  return new Promise((resolve, reject) => {
    const cancel = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", cancel);
      resolve();
    }, 50);
    signal.addEventListener("abort", cancel, { once: true });
  });
}
export async function prepared(
  reader: HistoryReader,
  handle: Handle,
  signal: AbortSignal,
  wait = pause,
): Promise<LocalCodeSnapshot> {
  for (let attempt = 0; attempt < 100; attempt++) {
    signal.throwIfAborted();
    const status = await reader.status(handle);
    signal.throwIfAborted();
    if (status.state === "ready") return status.data;
    if (status.state === "failed")
      throw new Error("Repository history preparation failed");
    await wait(signal);
  }
  throw new Error("Repository history preparation did not finish in time");
}
