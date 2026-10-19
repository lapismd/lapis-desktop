// SPDX-License-Identifier: Apache-2.0
import { OwnedAiWork } from "../../ai/core/owned-work.ts";
import type { NativeCall } from "../vault-client.ts";
import { nativeError } from "../native-error.ts";
const cancelled = () =>
  new DOMException("Transcript import was cancelled", "AbortError");
/** Native handles and prepared tickets only. This port cannot select paths or execute agents. */
export class NativeTranscriptScope {
  readonly #work = new OwnedAiWork();
  readonly #aborts = new Set<AbortController>();
  #handle?: Promise<string>;
  #closed = false;
  #closing?: Promise<void>;
  constructor(
    private readonly sessionId: string,
    private readonly call: NativeCall,
    private readonly allowed: () => boolean,
    private readonly purpose?: "capture",
  ) {}
  async #request<T>(request: Record<string, unknown>): Promise<T> {
    try {
      return await this.call<T>("desktop_ai_imports", { request });
    } catch (error) {
      throw nativeError(error);
    }
  }
  #check(signal: AbortSignal) {
    if (this.#closed || signal.aborted) throw cancelled();
    if (!this.allowed())
      throw new Error("AI session import is disabled in this workspace");
  }
  #open(): Promise<string> {
    return (this.#handle ??= this.#request<string>({
      type: "open",
      sessionId: this.sessionId,
      ...(this.purpose ? { purpose: this.purpose } : {}),
    }).catch((error) => {
      this.#handle = undefined;
      throw error;
    }));
  }
  run<T>(operation: Record<string, unknown>, signal: AbortSignal): Promise<T> {
    return this.#work.run(async () => {
      this.#check(signal);
      const abort = new AbortController();
      const forward = () => abort.abort();
      signal.addEventListener("abort", forward, { once: true });
      this.#aborts.add(abort);
      let cancel: (() => void) | undefined;
      let cancellation: Promise<void> | undefined;
      try {
        const handle = await this.#open();
        this.#check(abort.signal);
        const ticket = await this.#request<string>({ type: "prepare", handle });
        const release = () =>
          (cancellation ??= this.#request<void>({
            type: "cancel",
            handle,
            ticket,
          }));
        cancel = () => {
          void release().catch(() => {});
        };
        abort.signal.addEventListener("abort", cancel, { once: true });
        try {
          this.#check(abort.signal);
          const result = await this.#request<T>({
            ...operation,
            handle,
            ticket,
          });
          this.#check(abort.signal);
          return result;
        } finally {
          // Also retires a prepared ticket when cancellation won before dispatch.
          await release();
          this.#check(abort.signal);
        }
      } finally {
        signal.removeEventListener("abort", forward);
        if (cancel) abort.signal.removeEventListener("abort", cancel);
        this.#aborts.delete(abort);
      }
    });
  }
  close(): Promise<void> {
    this.#closed = true;
    for (const abort of this.#aborts) abort.abort();
    return (this.#closing ??= (async () => {
      // Native close fences immediately and drains workers; do not await reads first.
      if (this.#handle) {
        const handle = await this.#handle;
        await this.#request({ type: "close", handle });
      }
      await this.#work.settle();
    })().catch((error) => {
      this.#closing = undefined;
      throw error;
    }));
  }
}
