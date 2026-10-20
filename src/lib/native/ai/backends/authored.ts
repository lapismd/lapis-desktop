import type {
  AuthoredConversationPort,
  AuthoredConversationWrite,
  CanonicalAuthoredMessage,
  CanonicalAuthoredWrite,
} from "../../../ai/conversations/backend-port.ts";
import * as wire from "./wire.ts";
import { identity } from "./canonical-wire.ts";

function canonicalWrite(
  value: unknown,
  requestId: string,
  threadId: string,
): CanonicalAuthoredWrite | null {
  if (value === null) return null;
  const v = wire.record(value),
    conversation = identity(v.conversation);
  if (
    wire.id(v.requestId) !== requestId ||
    conversation.threadId !== threadId ||
    conversation.repository === null
  )
    return wire.invalid();
  return {
    requestId,
    conversation,
    messageId: wire.id(v.messageId),
    receipt: v.receipt === null ? null : wire.text(v.receipt),
  };
}

function write(
  value: unknown,
  requestId: string,
  conversationRequestId: string,
): AuthoredConversationWrite | null {
  if (value === null) return null;
  const v = wire.record(value);
  if (
    wire.id(v.requestId) !== requestId ||
    wire.id(v.conversationRequestId) !== conversationRequestId
  )
    return wire.invalid();
  return {
    requestId,
    conversationRequestId,
    messageId: wire.id(v.messageId),
    receipt: v.receipt === null ? null : wire.text(v.receipt),
  };
}
/** The renderer supplies only human text; native code owns identity and sanitization. */
export class NativeAuthoredConversations implements AuthoredConversationPort {
  constructor(private readonly call: wire.NativeBackendCall) {}
  async appendCanonical(handle: string, message: CanonicalAuthoredMessage) {
    wire.id(message.requestId);
    wire.id(message.threadId);
    const expectedSelection = wire.byteSelection(message.expectedSelection);
    wire.text(message.text, 256 * 1024);
    if (
      !expectedSelection.length ||
      !message.text.trim() ||
      message.text.includes("\0")
    )
      return wire.invalid();
    return (
      canonicalWrite(
        await this.call("canonicalConversationMessage", {
          type: "appendCanonicalConversationMessage",
          handle: wire.handle(handle),
          message: {
            requestId: message.requestId,
            threadId: message.threadId,
            expectedSelection,
            text: message.text,
          },
        }),
        message.requestId,
        message.threadId,
      ) ?? wire.invalid()
    );
  }
  async canonicalStatus(handle: string, requestId: string, threadId: string) {
    wire.id(requestId);
    wire.id(threadId);
    return canonicalWrite(
      await this.call("canonicalConversationMessage", {
        type: "canonicalConversationMessageStatus",
        handle: wire.handle(handle),
        requestId,
        threadId,
      }),
      requestId,
      threadId,
    );
  }
  async append(
    handle: string,
    requestId: string,
    conversationRequestId: string,
    text: string,
  ) {
    wire.id(requestId);
    wire.id(conversationRequestId);
    wire.text(text, 256 * 1024);
    if (!text.trim() || text.includes("\0")) return wire.invalid();
    return (
      write(
        await this.call("conversationMessage", {
          type: "appendConversationMessage",
          handle: wire.handle(handle),
          requestId,
          conversationRequestId,
          text,
        }),
        requestId,
        conversationRequestId,
      ) ?? wire.invalid()
    );
  }
  async status(
    handle: string,
    requestId: string,
    conversationRequestId: string,
  ) {
    wire.id(requestId);
    wire.id(conversationRequestId);
    return write(
      await this.call("conversationMessage", {
        type: "conversationMessageStatus",
        handle: wire.handle(handle),
        requestId,
        conversationRequestId,
      }),
      requestId,
      conversationRequestId,
    );
  }
}
