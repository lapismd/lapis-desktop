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
  let held: string | null = null;
  let resume: (() => void) | undefined;
  function release() {
    resume?.();
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
  target.invoke = async (name, args, options) => {
    const input = args as
      | {
          sessionId?: string;
          command?: NativeTaskCommand;
          request?: { operation?: string; path?: string };
        }
      | undefined;
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
    holdNextSubmit() {
      nextSubmit = true;
    },
    loseNextSubmitReply() {
      loseReply = true;
    },
    holdNextSave(path: string) {
      savePath = path;
    },
    release,
    snapshot: () => ({ held, records: structuredClone(records) }),
    dispose() {
      release();
      nextSubmit = false;
      loseReply = false;
      savePath = undefined;
      target.invoke = original;
    },
  };
}
