import { HistoryClient } from "@lapismd/jj-history";
import type { NativeCall } from "../vault-client.ts";
import { nativeError } from "../native-error.ts";

/** Keep native diagnostics alongside the ordinary notification Error. */
export function historyFailure(error: unknown): Error {
  const failure = nativeError(error);
  if (error && typeof error === "object" && "history" in error)
    Object.assign(failure, { history: error.history });
  return failure;
}

/** The public SDK owns lossless encoding/decoding; this only routes its text. */
export function coreHistory(
  vault: string,
  sessionId: string,
  call: NativeCall,
): HistoryClient {
  return new HistoryClient(vault, {
    async invoke(method, frame) {
      try {
        return await call<string>("desktop_repository_read", {
          request: { sessionId, method, frame },
        });
      } catch (error) {
        throw historyFailure(error);
      }
    },
  });
}
