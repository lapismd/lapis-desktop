import { nativeError } from "../native-error.ts";
import type { NativeCall } from "../vault-client.ts";
import {
  adoptionRequest,
  existingHistory,
  type AdoptionStatus,
  type AdoptionService,
} from "../../repository/adoption.ts";
export function nativeAdoption(
  sessionId: string,
  call: NativeCall,
): AdoptionService {
  async function request(action: unknown): Promise<AdoptionStatus> {
    try {
      const data = await call<AdoptionStatus>("desktop_backup_adoption", {
        request: { sessionId, action },
      });
      if (!data || !("source" in data) || !("pending" in data))
        throw new Error("Invalid history import state");
      if (
        data.source_unavailable !== undefined &&
        typeof data.source_unavailable !== "boolean"
      )
        throw new Error("Invalid history import source state");
      return {
        source_unavailable: data.source_unavailable === true,
        source: data.source === null ? null : existingHistory(data.source),
        pending: data.pending === null ? null : adoptionRequest(data.pending),
      };
    } catch (error) {
      throw nativeError(error);
    }
  }
  return {
    status: () => request({ kind: "status" }),
    adopt: async (value) =>
      request({ kind: "adopt", request: adoptionRequest(value) }),
    stop: (request_id) => request({ kind: "stop", request_id }),
  };
}
