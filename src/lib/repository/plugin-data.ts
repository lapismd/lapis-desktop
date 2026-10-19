type Owner = {
  app?: object;
  id?: string;
  loadData(): Promise<Record<string, unknown> | null>;
  saveData(value: Record<string, unknown>): Promise<void>;
};
const queues = new WeakMap<object, Map<string, Promise<unknown>>>();
/** Merge plugin-owned settings/recovery fields without losing another command. */
export function updateRepositoryData(
  owner: Owner,
  patch:
    | Record<string, unknown>
    | ((current: Record<string, unknown>) => Record<string, unknown>),
): Promise<Record<string, unknown>> {
  const scope = owner.app ?? owner;
  const id = owner.id ?? "";
  let queue = queues.get(scope);
  if (!queue) {
    queue = new Map();
    queues.set(scope, queue);
  }
  const pending = queue;
  const job = (pending.get(id) ?? Promise.resolve())
    .catch(() => {})
    .then(async () => {
      const current = (await owner.loadData()) ?? {};
      const updates = typeof patch === "function" ? patch(current) : patch;
      if (!Object.keys(updates).length) return current;
      const value = { ...current, ...updates };
      await owner.saveData(value);
      return value;
    });
  pending.set(id, job);
  void job
    .finally(() => {
      if (pending.get(id) === job) pending.delete(id);
      if (!pending.size) queues.delete(scope);
    })
    .catch(() => {});
  return job;
}
