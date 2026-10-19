import { updateRepositoryData } from "./plugin-data.ts";
import { pendingSync, type PendingSync } from "./sync.ts";
/** The completing command can clear only the record that it loaded or saved. */
export function syncRecovery(
  owner: Parameters<typeof updateRepositoryData>[0],
) {
  let original: unknown;
  return {
    async load() {
      original = (await owner.loadData())?.pendingSync;
      return original;
    },
    async save(pending?: PendingSync) {
      if (pending) original = pending;
      const own = original;
      await updateRepositoryData(owner, (current) => {
        if (pending) return { pendingSync: pending };
        const selected = pendingSync(current.pendingSync);
        const expected = pendingSync(own);
        const matches = expected
          ? selected?.request.request_id === expected.request.request_id
          : JSON.stringify(current.pendingSync) === JSON.stringify(own);
        return matches ? { pendingSync: null } : {};
      });
    },
  };
}
