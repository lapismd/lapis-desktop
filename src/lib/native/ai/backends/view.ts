import type { CanonicalConversationIdentity } from "../../../ai/conversations/backend-port.ts";
import type {
  NativeConversationView,
  NativeHumanMessage,
  NativeCollabRef,
} from "../../../ai/conversations/native-view.ts";
import {
  choice,
  label,
  list,
  nullable,
  schema,
  unique,
} from "./record-fields.ts";
import { acceptedMillis, collabRef } from "./view-fields.ts";
import { metadata } from "./view-metadata.ts";
import * as wire from "./wire.ts";

export function conversationView(
  raw: Record<string, unknown>,
  owner: CanonicalConversationIdentity,
): NativeConversationView {
  const h = wire.record(raw.thread),
    refs = wire.record(raw.references),
    messageRefs = wire.record(refs.messages);
  schema(h.schema_version);
  if (wire.id(h.thread_id) !== owner.threadId) return wire.invalid();
  const purpose = wire.record(h.purpose),
    target = wire.record(purpose.target);
  if (
    purpose.type !== "conversation" ||
    target.type !== owner.target.type ||
    (owner.target.type === "conversation"
      ? target.id !== owner.target.id
      : target.session !== owner.target.session)
  )
    return wire.invalid();
  let bytes = 0;
  const messages = unique(
    list(raw.messages, 64, (value): NativeHumanMessage => {
      const v = wire.record(value);
      schema(v.schema_version);
      if (wire.id(v.thread_id) !== owner.threadId) return wire.invalid();
      const body = nullable(v.body, (v) => wire.text(v, 256 * 1024));
      if (body === null && v.previous === null) return wire.invalid();
      bytes += body === null ? 0 : new TextEncoder().encode(body).byteLength;
      if (
        bytes > 256 * 1024 ||
        (body !== null && (!body.trim() || body.includes("\0")))
      )
        return wire.invalid();
      const emojiSource = v.emojis === undefined ? {} : wire.record(v.emojis),
        emojis: Record<string, NativeCollabRef> = {};
      if (Object.keys(emojiSource).length > 32) return wire.invalid();
      for (const [name, reference] of Object.entries(emojiSource))
        Object.defineProperty(emojis, label(name, 64), {
          value: collabRef(reference, "custom_emoji_version"),
          enumerable: true,
        });
      return {
        reference: collabRef(
          messageRefs[wire.id(v.message_id)],
          "human_message_revision",
        ),
        id: wire.id(v.message_id),
        threadId: owner.threadId,
        actor: wire.id(v.actor),
        acceptedAtMillis: acceptedMillis(v.accepted_at_millis),
        body,
        previous: nullable(v.previous, (v) =>
          collabRef(v, "human_message_revision"),
        ),
        replyTo:
          v.reply_to === undefined
            ? null
            : nullable(v.reply_to, (v) =>
                collabRef(v, "human_message_revision"),
              ),
        emojis,
        raw: v,
      };
    }),
    (v) => v.id,
  );
  if (Object.keys(messageRefs).length !== messages.length)
    return wire.invalid();
  return {
    identity: owner,
    header: {
      reference: collabRef(refs.thread, "thread_version"),
      id: owner.threadId,
      title: label(h.title, 1024),
      status: choice(h.status, [
        "created",
        "active",
        "idle",
        "archived",
        "tombstoned",
      ]),
      actor: wire.id(h.actor),
      acceptedAtMillis: acceptedMillis(h.accepted_at_millis),
      previous: nullable(h.previous, (v) => collabRef(v, "thread_version")),
      event: collabRef(h.event, "thread_event"),
      raw: h,
    },
    metadata: metadata(raw.metadata, owner, refs.metadata),
    messages,
    raw,
  };
}
