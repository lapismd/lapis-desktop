import type {
  CanonicalConversationPort,
  CanonicalConversationEdit,
} from "../../../ai/conversations/backend-port.ts";
import * as wire from "./wire.ts";
import { catalog, editWrite, openedCanonicalRead } from "./canonical-wire.ts";

/** Canonical reads preserve opaque targets and never initialize a preparation. */
export class NativeCanonicalConversations implements CanonicalConversationPort {
  constructor(private readonly call: wire.NativeBackendCall) {}
  async list(handle: string, cursor?: string | null) {
    return catalog(
      await this.call("conversationCatalog", {
        type: "listConversations",
        handle: wire.handle(handle),
        ...(cursor == null ? {} : { cursor: wire.text(cursor, 2048) }),
      }),
    );
  }
  async read(handle: string, threadId: string) {
    const result = await this.call("canonicalConversationView", {
      type: "readCanonicalConversation",
      handle: wire.handle(handle),
      threadId: wire.id(threadId),
    });
    return result === null ? null : wire.text(result);
  }
  async openRead(handle: string, threadId: string) {
    wire.id(threadId);
    const backend = wire.handle(handle);
    const result = await this.call("conversationRead", {
      type: "openCanonicalConversationRead",
      handle: backend,
      threadId,
    });
    try {
      return openedCanonicalRead(result, threadId);
    } catch (error) {
      let owned: string | undefined;
      try {
        owned = wire.handle(wire.record(result).handle);
      } catch {
        /* No validated handle to close. */
      }
      if (owned) {
        try {
          await this.call("closed", {
            type: "closeConversationRead",
            handle: backend,
            readHandle: owned,
          });
        } catch (cleanup) {
          throw new AggregateError(
            [error, cleanup],
            "Invalid conversation read could not be released",
          );
        }
      }
      throw error;
    }
  }
  async edit(handle: string, input: CanonicalConversationEdit) {
    const requestId = wire.id(input.requestId),
      threadId = wire.id(input.threadId);
    let action: CanonicalConversationEdit["action"];
    if (input.action.type === "rename") {
      const title =
        input.action.title === null
          ? null
          : wire.text(input.action.title, 1024);
      if (
        title !== null &&
        (!title.trim() || /[\u0000-\u001f\u007f-\u009f]/u.test(title))
      )
        return wire.invalid();
      action = { type: "rename", title };
    } else if (
      input.action.type === "lifecycle" &&
      ["activate", "idle", "archive", "tombstone", "restore"].includes(
        input.action.action,
      )
    )
      action = { type: "lifecycle", action: input.action.action };
    else return wire.invalid();
    const result = editWrite(
      await this.call("conversationEdit", {
        type: "editCanonicalConversation",
        handle: wire.handle(handle),
        edit: {
          requestId,
          threadId,
          expectedSelection: wire.byteSelection(input.expectedSelection),
          action,
        },
      }),
      requestId,
      threadId,
    );
    return result ?? wire.invalid();
  }
  async editStatus(handle: string, requestId: string, threadId: string) {
    wire.id(requestId);
    wire.id(threadId);
    return editWrite(
      await this.call("conversationEdit", {
        type: "canonicalConversationEditStatus",
        handle: wire.handle(handle),
        requestId,
        threadId,
      }),
      requestId,
      threadId,
    );
  }
}
