import type {
  CanonicalCapturePreparation,
  ManagedConversationPort,
  PreparedCanonicalCapture,
} from "../../../ai/conversations/backend-port.ts";
import { identity } from "./canonical-wire.ts";
import * as wire from "./wire.ts";
import { participant } from "./capture-facts.ts";

/** Prepare one native target; no launch, fallback writer or automatic retry. */
export class NativeManagedConversations implements ManagedConversationPort {
  constructor(
    private readonly call: (
      kind: string,
      operation: Record<string, unknown>,
    ) => Promise<unknown>,
  ) {}
  async prepareCanonical(
    handle: string,
    input: CanonicalCapturePreparation,
  ): Promise<PreparedCanonicalCapture> {
    const expected = identity(input.conversation);
    const expectedSelection = wire.byteSelection(input.expectedSelection);
    if (
      expected.repository === null ||
      input.clientId !== "codex" ||
      !expectedSelection.length
    )
      return wire.invalid();
    const requestId = wire.id(input.requestId);
    const result = wire.record(
      await this.call("canonicalCapture", {
        type: "prepareCanonicalManagedCapture",
        handle: wire.handle(handle),
        requestId,
        threadId: expected.threadId,
        expectedSelection,
        clientId: input.clientId,
        ...(input.dispatchRequestId === undefined
          ? {}
          : { dispatchRequestId: wire.id(input.dispatchRequestId) }),
        ...(input.participant === undefined
          ? {}
          : { participant: participant(input.participant) }),
      }),
    );
    const conversation = identity(result.conversation);
    if (
      wire.id(result.requestId) !== requestId ||
      conversation.threadId !== expected.threadId ||
      conversation.repository !== expected.repository ||
      JSON.stringify(conversation.target) !== JSON.stringify(expected.target)
    )
      return wire.invalid();
    return {
      requestId,
      conversation,
      targetId: wire.handle(result.targetId),
    };
  }
}
