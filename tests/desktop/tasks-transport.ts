import type {
  NativeTaskCommand,
  NativeTaskValue,
} from "@lapis-notes/api/native-tasks";

type Invoke = (
  command: string,
  args?: unknown,
  options?: unknown,
) => Promise<unknown>;
type Record = {
  sequence: number;
  sessionId: string;
  command: NativeTaskCommand;
  native?: NativeTaskValue;
  error?: string;
  lostReply?: boolean;
};

/** E2e transport faults only: all admitted work still belongs to native Core. */
export function observeTaskTransport(target: { invoke: Invoke }) {
  const original = target.invoke;
  const records: Record[] = [];
  let sequence = 0;
  let nextSubmit = false;
  let loseReply = false;
  let savePath: string | undefined;
  let editingSnapshotPath: string | undefined;
  const failedEditingSnapshots: string[] = [];
  let held: string | null = null;
  let resume: (() => void) | undefined;
  let reads:
    | { path: string; pending: Promise<void>; release(): void }
    | undefined;
  const writes: { path?: string; operation?: string }[] = [];
  function release() {
    resume?.();
    reads?.release();
    reads = undefined;
    resume = undefined;
    held = null;
  }
  async function hold(label: string) {
    if (resume) throw new Error("Another native Task transport gate is held");
    held = label;
    await new Promise<void>((resolve) => {
      resume = resolve;
    });
  }
  const invoke: Invoke = async (name, args, options) => {
    const input = args as
      | {
          sessionId?: string;
          path?: string;
          command?: NativeTaskCommand;
          request?: { operation?: string; path?: string };
        }
      | undefined;
    if (
      name === "vault_editing_snapshot" &&
      editingSnapshotPath !== undefined &&
      input?.path === editingSnapshotPath
    ) {
      const path = editingSnapshotPath;
      editingSnapshotPath = undefined;
      failedEditingSnapshots.push(path);
      if (failedEditingSnapshots.length > 256) failedEditingSnapshots.shift();
      throw new Error(`Protected saved-text observation failed: ${path}`);
    }
    if (name === "vault_fs" && input?.request) {
      const { operation, path } = input.request;
      if (/^(write|append|rename|remove)/u.test(operation ?? "")) {
        writes.push({ operation, path });
        if (writes.length > 256) writes.shift();
      }
      if (operation === "read-text" && reads?.path === path) {
        held = `read:${path}`;
        await reads.pending;
      }
    }
    if (
      name === "vault_fs" &&
      savePath !== undefined &&
      input?.request?.operation === "write-text-if-unchanged" &&
      input.request.path === savePath
    ) {
      const path = savePath;
      savePath = undefined;
      await hold(`save:${path}`);
    }
    if (name !== "vault_tasks" || !input?.command)
      return original.call(target, name, args, options);
    const record: Record = {
      sequence: ++sequence,
      sessionId: input.sessionId ?? "",
      command: structuredClone(input.command),
    };
    records.push(record);
    if (records.length > 256) records.shift();
    const submit = input.command.kind === "submit";
    const discard = submit && loseReply;
    if (submit) loseReply = false;
    try {
      if (submit && nextSubmit) {
        nextSubmit = false;
        await hold("submit");
      }
      const native = await original.call(target, name, args, options);
      record.native = structuredClone(native) as NativeTaskValue;
      if (discard) {
        record.lostReply = true;
        throw new Error(
          "Native Task reply lost after admission; inspect the retained request",
        );
      }
      return native;
    } catch (error) {
      record.error =
        error instanceof Error ? error.message : JSON.stringify(error);
      throw error;
    }
  };
  return {
    invoke,
    holdNextSubmit() {
      nextSubmit = true;
    },
    loseNextSubmitReply() {
      loseReply = true;
    },
    holdNextSave(path: string) {
      savePath = path;
    },
    failNextEditingSnapshot(path: string) {
      editingSnapshotPath = path;
    },
    holdFileReads(path: string) {
      if (reads || resume) throw new Error("Another transport gate is held");
      let done!: () => void;
      const pending = new Promise<void>((resolve) => (done = resolve));
      reads = { path, pending, release: done };
    },
    release,
    snapshot: () => ({
      held,
      records: structuredClone(records),
      writes: structuredClone(writes),
      failedEditingSnapshots: [...failedEditingSnapshots],
    }),
    dispose() {
      release();
      nextSubmit = false;
      loseReply = false;
      savePath = undefined;
      editingSnapshotPath = undefined;
    },
  };
}
