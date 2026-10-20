import type { TranscriptItem } from "@lapismd/design-core/chat";
import type { NativeConversationView } from "../conversations/native-view.ts";

/** No fallback time or local-user attribution is invented for a native actor. */
export function nativeCreatedAt(millis: bigint): string | undefined {
  return millis >= -8640000000000000n && millis <= 8640000000000000n
    ? new Date(Number(millis)).toISOString()
    : undefined;
}
export function projectNativeThread(
  view: NativeConversationView,
): TranscriptItem[] {
  return view.messages
    .filter((v) => v.body !== null)
    .map((message) => {
      const id = `native/thread/${view.identity.threadId}/message/${message.id}`;
      return {
        id,
        kind: "message",
        role: "user",
        label: "Authored thread message",
        author: {
          id: message.actor,
          name: `Author ${message.actor.slice(0, 8)}`,
          initials: "AU",
        },
        createdAt: nativeCreatedAt(message.acceptedAtMillis),
        timestamp: nativeCreatedAt(message.acceptedAtMillis)
          ? undefined
          : `${message.acceptedAtMillis} ms`,
        edited: message.previous !== null,
        blocks: [
          {
            id: `${id}/body`,
            revision: message.reference.id,
            kind: "markdown",
            text: message.body!,
            label: "Authored thread message",
            commentable: false,
          },
        ],
      };
    });
}
