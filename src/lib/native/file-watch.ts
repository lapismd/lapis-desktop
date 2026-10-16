import { Channel } from "@tauri-apps/api/core";
import type {
  ChangeEvent,
  NativeWatchSubscription,
  WatchErrorEvent,
} from "@lapis-notes/api";
import type { NativeCall, VaultDescriptor } from "./vault-client.ts";
import { vaultPath } from "./vault-path.ts";

export type WatchChannelFactory = (
  listener: (value: unknown) => void,
) => unknown;
export const nativeWatchChannel: WatchChannelFactory = (listener) =>
  new Channel<unknown>(listener);

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid native watch frame");
  return value as Record<string, unknown>;
}
function scopedPath(value: unknown, scope: string, recursive: boolean): string {
  const path = vaultPath(value);
  const tail = scope
    ? path.startsWith(`${scope}/`)
      ? path.slice(scope.length + 1)
      : null
    : path;
  if (path !== scope && (tail === null || (!recursive && tail.includes("/"))))
    throw new Error("Watch change is outside its subscription");
  return path;
}
function changes(
  value: unknown,
  scope: string,
  recursive: boolean,
): ChangeEvent[] {
  if (!Array.isArray(value) || value.length > 256)
    throw new Error("Watch change limit exceeded");
  let bytes = 0;
  const encoder = new TextEncoder();
  return value.map((value) => {
    const change = record(value);
    if (
      typeof change.type !== "string" ||
      !["create", "modify", "delete"].includes(change.type)
    )
      throw new Error("Invalid watch change kind");
    const path = scopedPath(change.path, scope, recursive);
    const previousPath =
      change.previousPath === undefined
        ? undefined
        : scopedPath(change.previousPath, scope, recursive);
    bytes +=
      encoder.encode(path).length +
      encoder.encode(previousPath ?? "").length +
      64;
    if (bytes > 128 * 1024) throw new Error("Watch delivery size exceeded");
    return {
      type: change.type as ChangeEvent["type"],
      path,
      ...(previousPath === undefined ? {} : { previousPath }),
    };
  });
}

export function startFileWatch(
  call: NativeCall,
  selected: VaultDescriptor,
  path: string,
  recursive: boolean,
  listener: (event: ChangeEvent | WatchErrorEvent) => void,
  channel: WatchChannelFactory = nativeWatchChannel,
): NativeWatchSubscription {
  const scope = vaultPath(path);
  let retired = false;
  let sequence = 0;
  let closing: Promise<void> | undefined;
  const failure = (error: unknown) => {
    if (!retired) listener({ type: "error", path: scope || "/", error });
  };
  const onChange = channel((value) => {
    if (retired) return;
    let events: ChangeEvent[];
    try {
      const frame = record(value);
      if (
        !Number.isSafeInteger(frame.sequence) ||
        Number(frame.sequence) <= 0 ||
        typeof frame.reconciliation !== "boolean"
      )
        throw new Error("Invalid watch continuity");
      const next = Number(frame.sequence);
      const discontinuity = next !== sequence + 1;
      sequence = Math.max(sequence, next);
      events = changes(frame.changes, scope, recursive);
      if (discontinuity || frame.reconciliation || frame.error !== undefined)
        throw new Error(
          typeof frame.error === "string"
            ? frame.error
            : "Watch continuity requires reconciliation",
        );
    } catch (error) {
      failure(
        Object.assign(
          new Error(
            error instanceof Error
              ? error.message
              : "Invalid native watch delivery",
          ),
          { code: "EWATCHRECONCILE" },
        ),
      );
      return;
    }
    for (const event of events) {
      if (retired) break;
      listener(event);
    }
  });
  const started = call<unknown>("vault_watch_start", {
    sessionId: selected.sessionId,
    path: scope,
    recursive,
    onChange,
  }).then((id) => {
    if (typeof id !== "string" || !id || id.length > 128)
      throw new Error("Invalid native watch identity");
    return id;
  });
  const ready = started.then(() => {});
  void ready.catch(failure);
  const admitted = started.catch(() => null);
  return {
    ready,
    close() {
      retired = true;
      closing ??= admitted.then(async (watchId) => {
        if (watchId !== null)
          await call<void>("vault_watch_stop", {
            sessionId: selected.sessionId,
            watchId,
          });
      });
      void closing.catch(() => {
        closing = undefined;
      });
      return closing;
    },
  };
}
