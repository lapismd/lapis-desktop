import { portableBackupFile } from "./transcript-paths.ts";
import type { PendingRestore } from "./restore.ts";
/** Saved view/config state is input, never native authority. */
export function restoreRecovery(value: unknown): PendingRestore | undefined {
  if (value == null) return;
  if (!value || typeof value !== "object")
    throw new Error("Invalid interrupted restore record");
  const saved = value as PendingRestore;
  const request = saved.request;
  if (
    saved.version !== 1 ||
    !["file", "vault"].includes(saved.scope) ||
    !request ||
    typeof request !== "object" ||
    typeof request.request_id !== "string" ||
    !/^[a-zA-Z0-9-]{1,128}$/.test(request.request_id) ||
    typeof request.checkpoint !== "string" ||
    !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(request.checkpoint) ||
    typeof request.expected !== "string" ||
    !/^(?:missing|[a-f0-9]{40}|[a-f0-9]{64})$/.test(request.expected)
  )
    throw new Error("Invalid interrupted restore record");
  if (
    saved.scope === "file" &&
    (typeof saved.request.path !== "string" ||
      saved.request.path.length > 4096 ||
      saved.request.path.includes("\\") ||
      saved.request.path
        .split("/")
        .some((part) => ["", ".", "..", ".jj", ".git"].includes(part)))
  )
    throw new Error("Invalid interrupted file restore path");
  if (saved.scope === "file" && !portableBackupFile(saved.request.path))
    throw new Error("Invalid interrupted file restore path");
  return saved;
}
