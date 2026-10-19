import type { RemoteService, RemoteSnapshot } from "./remote.ts";
import type { SyncService } from "./sync.ts";

/** Observe the retained intent before allowing any new publication request. */
export async function observePublication(
  service: RemoteService,
  snapshot: RemoteSnapshot,
): Promise<RemoteSnapshot> {
  if (!snapshot.publication || !service.publication) return snapshot;
  const current = await service.publication.observe(
    snapshot.revision,
    snapshot.publication.request_id,
  );
  if (
    current.publication &&
    (current.publication.outcome !== "prepared" ||
      !current.configuration?.canPush)
  )
    throw new Error(
      "The original push still needs observation; local history is safe",
    );
  return current;
}

export async function publishSync(service: SyncService, revision: number) {
  const result = await service.publish(revision, crypto.randomUUID());
  if (result !== "complete")
    throw new Error(
      result === "unknown"
        ? "The original push still needs observation; local history is safe"
        : result === "stopped"
          ? "The original push stopped tracking; synchronize again to create a new request"
          : "The remote advanced; synchronization will fetch and merge again",
    );
}

/** A proven push stays successful even if refreshing its optional counts fails. */
export async function refreshPublished(
  service: RemoteService,
  previous: RemoteSnapshot,
): Promise<RemoteSnapshot> {
  try {
    return await service.fetch(previous.revision);
  } catch {
    return { ...previous, divergence: null };
  }
}
