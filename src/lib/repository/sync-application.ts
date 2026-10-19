import type { RemoteService } from "./remote.ts";
import type { PendingSync, SyncService } from "./sync.ts";

/** Guard and persist the original apply identity before any physical writes. */
export async function applyCandidate(options: {
  candidate: string;
  revision: number;
  service: SyncService;
  remote: RemoteService;
  recovery: { save(pending?: PendingSync): Promise<void> };
  guard: <T>(action: () => Promise<T>) => Promise<T>;
  cancelled(): boolean;
  closed(): boolean;
  pending(value?: PendingSync): void;
  applying(): void;
}) {
  const { service, revision, candidate } = options;
  await options.guard(async () => {
    if (options.cancelled()) return;
    const current = await options.remote.status();
    if (options.cancelled()) return;
    if (current.revision !== revision)
      throw new Error("Backup connection changed; synchronize again");
    const preview = await service.preview(candidate, revision);
    if (options.cancelled()) return;
    const pending: PendingSync = {
      version: 1,
      revision,
      request: {
        request_id: crypto.randomUUID(),
        checkpoint: preview.checkpoint,
        expected: preview.expected,
      },
    };
    options.pending(pending);
    await options.recovery.save(pending);
    if (options.closed()) return;
    options.applying();
    await service.apply(pending.request, revision);
    if (options.closed()) return;
    await options.recovery.save(undefined);
    options.pending(undefined);
  });
}
