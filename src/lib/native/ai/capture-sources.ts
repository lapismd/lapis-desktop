// SPDX-License-Identifier: Apache-2.0
import type {
  AiCaptureSource,
  AiCaptureSources,
  CaptureRead,
} from "../../ai/capture/source-port.ts";
import type { NativeCall } from "../vault-client.ts";
import { NativeTranscriptScope } from "./transcript-scope.ts";
const deliveryId =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u;
export class NativeCaptureSources implements AiCaptureSources {
  readonly #connections = new Set<AiCaptureSource>();
  #closed = false;
  constructor(
    private readonly sessionId: string,
    private readonly call: NativeCall,
    private readonly allowed: () => boolean,
  ) {}
  connect(): AiCaptureSource {
    if (this.#closed) throw new Error("AI capture is closed");
    if (this.#connections.size) throw new Error("AI capture is already active");
    const scope = new NativeTranscriptScope(
      this.sessionId,
      this.call,
      this.allowed,
      "capture",
    );
    const connection: AiCaptureSource = {
      next: async (signal) => {
        const value = await scope.run<CaptureRead>(
          { type: "nextCapture" },
          signal,
        );
        if (
          !value ||
          !Number.isSafeInteger(value.deferred) ||
          value.deferred < 0 ||
          value.deferred > 256 ||
          (value.type === "idle"
            ? !Number.isSafeInteger(value.eligible) ||
              value.eligible < 0 ||
              value.eligible > 256
            : value.type !== "snapshot" || !deliveryId.test(value.delivery))
        )
          throw new Error("Invalid capture observation");
        // The local import planner independently validates/sanitizes the full snapshot.
        return value;
      },
      confirm: (delivery, signal) => {
        if (!deliveryId.test(delivery))
          return Promise.reject(new Error("Invalid capture delivery"));
        return scope.run({ type: "confirmCapture", delivery }, signal);
      },
      close: async () => {
        await scope.close();
        this.#connections.delete(connection);
      },
    };
    this.#connections.add(connection);
    return connection;
  }
  async close(): Promise<void> {
    this.#closed = true;
    const results = await Promise.allSettled(
      [...this.#connections].map((c) => c.close()),
    );
    const errors = results.flatMap((r) =>
      r.status === "rejected" ? [r.reason] : [],
    );
    if (errors.length)
      throw new AggregateError(errors, "AI capture cleanup failed");
  }
}
