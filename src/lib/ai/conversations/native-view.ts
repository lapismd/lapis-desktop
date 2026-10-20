import type { CanonicalConversationIdentity } from "./backend-port.ts";

/** The complete decoded source object remains attached to every derived view. */
export type NativeSourceObject = Record<string, unknown>;
export type NativeCollabRef = { kind: string; id: string };
export type NativeConversationHeader = {
  reference: NativeCollabRef;
  id: string;
  title: string;
  status: "created" | "active" | "idle" | "archived" | "tombstoned";
  actor: string;
  acceptedAtMillis: bigint;
  previous: NativeCollabRef | null;
  event: NativeCollabRef;
  raw: NativeSourceObject;
};
export type NativeConversationMetadata = {
  reference: NativeCollabRef;
  threadId: string;
  actor: string;
  requestId: string;
  acceptedAtMillis: bigint;
  customTitle: string | null;
  generated: {
    title: string;
    summary: string;
    keywords: string[];
    goals: string[];
    provider: string;
    model: string;
    promptVersion: number;
    generatedAtMillis: bigint;
    truncated: boolean;
    sources: NativeSourceObject[];
    raw: NativeSourceObject;
  } | null;
  agentTitles: Record<string, string>;
  agentTitleSources: Record<string, NativeSourceObject>;
  previous: NativeCollabRef | null;
  raw: NativeSourceObject;
};
export type NativeHumanMessage = {
  reference: NativeCollabRef;
  id: string;
  threadId: string;
  actor: string;
  acceptedAtMillis: bigint;
  body: string | null;
  previous: NativeCollabRef | null;
  replyTo: NativeCollabRef | null;
  emojis: Record<string, NativeCollabRef>;
  raw: NativeSourceObject;
};
export type NativeConversationView = {
  identity: CanonicalConversationIdentity;
  header: NativeConversationHeader;
  metadata: NativeConversationMetadata | null;
  messages: NativeHumanMessage[];
  raw: NativeSourceObject;
};
export function nativeConversationTitle(view: NativeConversationView): string {
  const metadata = view.metadata;
  if (metadata?.customTitle !== null && metadata?.customTitle !== undefined)
    return metadata.customTitle;
  if (metadata?.generated) return metadata.generated.title;
  const titles = Object.values(metadata?.agentTitles ?? {});
  return titles.length && titles.every((title) => title === titles[0])
    ? titles[0]!
    : view.header.title;
}
