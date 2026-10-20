import type { CanonicalConversationRead } from "./backend-port.ts";
import { sameCanonicalConversation } from "./catalog-pages.ts";
import { assertManagedTurn, turnErrorText } from "./managed-turn-state.ts";
import type {
  NativeDispatchInput,
  NativeDispatchView,
} from "./dispatch-port.ts";
import type {
  ManagedAgentLauncher,
  ManagedDeliveryState,
  ManagedTurnPort,
  ManagedTurnRecipient,
  ManagedTurnState,
} from "./managed-turn-types.ts";

type Owner = {
  port: ManagedTurnPort;
  launcher: ManagedAgentLauncher;
  handle: string;
  read: Pick<CanonicalConversationRead, "identity" | "selection">;
  text: string;
  recipients: readonly ManagedTurnRecipient[];
  state(): ManagedTurnState;
  assertOpen(): void;
  publish(patch: Partial<ManagedTurnState>): void;
  delivery(index: number, patch: Partial<ManagedDeliveryState>): void;
  retainRead(handle: string): void;
  beginDispatch(input: NativeDispatchInput): Promise<NativeDispatchView>;
  releaseRead(handle: string): Promise<void>;
};
/** No worker starts until every intended participation has a native plan. */
export async function prepareManagedTurn(owner: Owner): Promise<void> {
  let authoredAttempted = false;
  let readHandle: string | undefined;
  let releasing = false;
  owner.publish({ phase: "preparing" });
  try {
    for (const recipient of owner.recipients) {
      if (
        !(await owner.launcher.supports({ ...recipient.request, prompt: "" }))
      )
        throw new Error("An intended native agent is unavailable");
      owner.assertOpen();
    }
    if (owner.text.trim()) {
      authoredAttempted = true;
      const authored = await owner.port.authored.appendCanonical(owner.handle, {
        requestId: owner.state().nativeRequestId,
        threadId: owner.read.identity.threadId,
        expectedSelection: owner.read.selection,
        text: owner.text,
      });
      if (
        authored.requestId !== owner.state().nativeRequestId ||
        !sameCanonicalConversation(
          authored.conversation,
          owner.read.identity,
        ) ||
        !authored.receipt
      )
        throw new Error(
          "Native authorship is not confirmed; inspect its original status",
        );
      owner.publish({ authored, authorship: "confirmed" });
      owner.assertOpen();
    }
    // Authorship advances metadata. Prepare all plans against one fresh pin,
    // before any provider startup output can advance the selected thread.
    const current = await owner.port.canonical.openRead(
      owner.handle,
      owner.read.identity.threadId,
    );
    if (!current) throw new Error("Native conversation is no longer available");
    readHandle = current.handle;
    owner.retainRead(readHandle);
    owner.assertOpen();
    if (!sameCanonicalConversation(current.identity, owner.read.identity))
      throw new Error("Native conversation changed its canonical identity");
    assertManagedTurn(current, owner.text, owner.recipients);
    await owner.beginDispatch({
      requestId: owner.state().nativeRequestId,
      threadId: current.identity.threadId,
      expectedSelection: current.selection,
      authored: !!owner.text.trim(),
      recipients: owner.state().deliveries.map((delivery) => ({
        requestId: delivery.id,
        participant: delivery.participant ?? null,
      })),
    });
    owner.assertOpen();
    for (const [index, recipient] of owner.recipients.entries()) {
      owner.assertOpen();
      try {
        const prepared = await owner.port.managed.prepareCanonical(
          owner.handle,
          {
            requestId: owner.state().deliveries[index]!.id,
            conversation: current.identity,
            expectedSelection: current.selection,
            clientId: "codex",
            dispatchRequestId: owner.state().nativeRequestId,
            ...(recipient.participant
              ? { participant: recipient.participant }
              : {}),
          },
        );
        if (
          prepared.requestId !== owner.state().deliveries[index]!.id ||
          !sameCanonicalConversation(prepared.conversation, current.identity)
        )
          throw new Error(
            "Native capture preparation changed its original identity",
          );
        owner.delivery(index, { phase: "prepared", preparation: prepared });
      } catch (error) {
        owner.delivery(index, {
          phase: "unknown",
          error: turnErrorText(error),
        });
        throw error;
      }
    }
    releasing = true;
    await owner.releaseRead(readHandle);
    readHandle = undefined;
    owner.assertOpen();
    owner.publish({ phase: "ready" });
  } catch (error) {
    owner.publish({
      phase: "failed",
      error: turnErrorText(error),
      ...(authoredAttempted && owner.state().authorship === "pending"
        ? { authorship: "unknown" as const }
        : {}),
    });
    throw error;
  } finally {
    if (readHandle && !releasing) {
      // One cleanup attempt; a lost close remains owned for explicit close retry.
      await owner.releaseRead(readHandle).catch(() => undefined);
    }
  }
}
