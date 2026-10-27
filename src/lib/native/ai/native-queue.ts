import type { NativeChatQueue } from "@lapis-notes/app-profile/native-chat";
import type { QueueValue, TurnValue } from "@lapis-notes/api/native-turns";

type Native = <T>(command: string, request: unknown) => Promise<T>;

/** Queue values and complete capture metadata come from the admitted owner. */
export function createNativeQueue(
  sessionId: string,
  native: Native,
): NativeChatQueue {
  return {
    call: (command) =>
      native<QueueValue>("desktop_ai_queue", { sessionId, command }),
    selection: async (targetId) => {
      const value = await native<TurnValue>("desktop_ai_turn", {
        sessionId,
        command: { kind: "targets" },
      });
      if (value.kind !== "targets") return undefined;
      const selection = value.targets.find(
        (target) => target.id === targetId,
      )?.queue_selection;
      return selection ? structuredClone(selection) : undefined;
    },
  };
}
