import type { CanonicalConversationIdentity } from "../../../ai/conversations/backend-port.ts";
import type { NativeConversationMetadata } from "../../../ai/conversations/native-view.ts";
import { label, list, nullable, schema } from "./record-fields.ts";
import { acceptedMillis, boolean, collabRef } from "./view-fields.ts";
import * as wire from "./wire.ts";

function source(value: unknown) {
  const v = wire.record(value),
    snapshot = wire.record(v.snapshot);
  wire.id(v.session);
  if (
    snapshot.kind !== "session_snapshot" ||
    typeof snapshot.id !== "string" ||
    !/^[0-9a-f]{64}$/u.test(snapshot.id)
  )
    return wire.invalid();
  return v;
}
export function metadata(
  value: unknown,
  owner: CanonicalConversationIdentity,
  reference: unknown,
): NativeConversationMetadata | null {
  if (value === null) {
    if (reference !== null) return wire.invalid();
    return null;
  }
  const raw = wire.record(value),
    target = wire.record(raw.target),
    v = wire.record(raw.value);
  schema(raw.schema_version);
  if (
    wire.id(raw.thread_id) !== owner.threadId ||
    target.type !== owner.target.type ||
    (owner.target.type === "conversation"
      ? target.id !== owner.target.id
      : target.session !== owner.target.session)
  )
    return wire.invalid();
  const generated = nullable(v.generated, (value) => {
    const g = wire.record(value);
    const sources = list(g.sources, 16, source);
    if (
      typeof g.summary !== "string" ||
      !g.summary.trim() ||
      typeof g.title !== "string" ||
      g.title.trim().split(/\s+/u).length > 7
    )
      return wire.invalid();
    if (
      !sources.length ||
      g.prompt_version !== 1 ||
      new Set(sources.map((s) => s.session)).size !== sources.length
    )
      return wire.invalid();
    return {
      title: label(g.title, 256),
      summary: wire.text(g.summary, 4096),
      keywords: list(g.keywords, 20, (v) => label(v, 256)),
      goals: list(g.goals, 6, (v) => label(v, 256)),
      sources,
      provider: label(g.provider, 64),
      model: label(g.model, 256),
      promptVersion: 1,
      generatedAtMillis: acceptedMillis(g.generated_at_millis),
      truncated: boolean(g.truncated),
      raw: g,
    };
  });
  const titles = wire.record(v.agent_titles),
    sources =
      v.agent_title_sources === undefined
        ? {}
        : wire.record(v.agent_title_sources);
  if (
    Object.keys(titles).length > 16 ||
    Object.keys(titles).length !== Object.keys(sources).length
  )
    return wire.invalid();
  const agentTitles: Record<string, string> = {},
    agentTitleSources: Record<string, ReturnType<typeof source>> = {};
  for (const [key, value] of Object.entries(titles)) {
    label(key, 128);
    Object.defineProperty(agentTitles, key, {
      value: label(value, 1024),
      enumerable: true,
    });
    Object.defineProperty(agentTitleSources, key, {
      value: source(sources[key]),
      enumerable: true,
    });
  }
  return {
    reference: collabRef(reference, "conversation_metadata"),
    threadId: owner.threadId,
    actor: wire.id(raw.actor),
    requestId: wire.id(raw.request_id),
    acceptedAtMillis: acceptedMillis(raw.accepted_at_millis),
    customTitle: nullable(v.custom_title, (v) => label(v, 1024)),
    generated,
    agentTitles,
    agentTitleSources,
    previous: nullable(raw.previous, (v) =>
      collabRef(v, "conversation_metadata"),
    ),
    raw,
  };
}
