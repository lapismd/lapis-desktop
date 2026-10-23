// SPDX-License-Identifier: Apache-2.0
// Adapted from jj-store CommunityMarkdownContent syntax-hast-links/MemberReference.
import { mount, unmount } from "svelte";
import { Decoration, WidgetType, type EditorView } from "@codemirror/view";
import { defineMiraExtension } from "@lapismd/mira/extensions";
import { promptElementsExtension } from "@lapismd/design-core/chat";
import type { App } from "@lapis-notes/api";
import type { AgentRecipientOption } from "../../../lib/ai/conversations/recipients.ts";
import {
  agentIdFromHref,
  agentMentionReferences,
  bareAgentMentionReferences,
} from "../../../lib/ai/chat/agent-mentions.ts";
import { transcriptLinks as noteLinks } from "../../../lib/ai/chat/transcript-links.ts";
import ChatInlineReference from "./ChatInlineReference.svelte";

type MentionProps = {
  label: string;
  title: string;
  identityId: string;
  image?: string;
  background?: string;
  description?: string;
};
class AgentLink extends WidgetType {
  constructor(readonly props: MentionProps) {
    super();
  }
  eq(other: AgentLink) {
    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }
  toDOM(view: EditorView) {
    const host = view.dom.ownerDocument.createElement("span");
    const instance = mount(ChatInlineReference, {
      target: host,
      props: { ...this.props, kind: "agent" },
    });
    cleanup.set(host, () => {
      void unmount(instance);
    });
    return host;
  }
  destroy(host: HTMLElement) {
    cleanup.get(host)?.();
    cleanup.delete(host);
  }
}
const cleanup = new WeakMap<HTMLElement, () => void>();
type MarkdownNode = {
  type: string;
  url?: string;
  value?: string;
  children?: MarkdownNode[];
  data?: Record<string, unknown>;
  position?: { start: MarkdownPoint; end: MarkdownPoint };
};
type MarkdownPoint = { offset?: number; line?: number; column?: number };
const textContent = (node: MarkdownNode): string =>
  node.value ?? (node.children ?? []).map(textContent).join("");

/** Host-owned links use public reader/Markdown hooks; source and anchors stay exact. */
export function transcriptLinks(
  app?: App,
  sourcePath = "",
  profiles: readonly AgentRecipientOption[] = [],
  prompts = false,
) {
  const notes = noteLinks(app, sourcePath);
  function props(id: string, label?: string): MentionProps {
    const profile = profiles.find((profile) => profile.id === id);
    return {
      identityId: id,
      label: label ?? profile?.label ?? "Unavailable agent",
      title: profile?.label ?? id,
      image: profile?.avatar,
      background: profile?.avatarBackground,
      description: profile
        ? `${profile.agent} · ${profile.model ?? "Default model"}`
        : "Saved agent reference; not available in the current catalog.",
    };
  }
  const extension = defineMiraExtension({
    name: "lapis-agent-mentions",
    components: { chatagent: ChatInlineReference },
    remarkPlugins: [
      () => (tree: MarkdownNode, file: { value?: unknown }) => {
        const source = String(file.value ?? "");
        function visit(node: MarkdownNode) {
          if (node.type === "link") {
            const id = agentIdFromHref(node.url ?? "");
            if (id) {
              node.data = {
                ...node.data,
                hName: "chatagent",
                hProperties: { ...props(id, textContent(node)), kind: "agent" },
              };
              node.children = [];
            }
            return;
          }
          if (["code", "inlineCode", "html", "image"].includes(node.type))
            return;
          if (!node.children) return;
          node.children = node.children.flatMap((child) => {
            visit(child);
            const value = child.value;
            if (
              child.type !== "text" ||
              !value ||
              child.position?.start.offset === undefined ||
              child.position?.end.offset === undefined ||
              source.slice(
                child.position?.start.offset,
                child.position?.end.offset,
              ) !== value
            )
              return [child];
            const references = bareAgentMentionReferences(value);
            if (!references.length) return [child];
            const position = (from: number, to: number) => {
              const point = (at: number) => {
                const prefix = value.slice(0, at),
                  lastNewline = prefix.lastIndexOf("\n");
                return {
                  offset: child.position!.start.offset! + at,
                  line:
                    (child.position!.start.line ?? 1) +
                    prefix.split("\n").length -
                    1,
                  column:
                    lastNewline < 0
                      ? (child.position!.start.column ?? 1) + at
                      : at - lastNewline,
                };
              };
              return { start: point(from), end: point(to) };
            };
            const parts: MarkdownNode[] = [];
            let cursor = 0;
            for (const ref of references) {
              if (ref.from > cursor)
                parts.push({
                  type: "text",
                  value: value.slice(cursor, ref.from),
                  position: position(cursor, ref.from),
                });
              parts.push({
                type: "link",
                url: value.slice(ref.from, ref.to),
                position: position(ref.from, ref.to),
                children: [],
                data: {
                  hName: "chatagent",
                  hProperties: { ...props(ref.agentId), kind: "agent" },
                },
              });
              cursor = ref.to;
            }
            if (cursor < value.length)
              parts.push({
                type: "text",
                value: value.slice(cursor),
                position: position(cursor, value.length),
              });
            return parts;
          });
        }
        visit(tree);
      },
    ],
  });
  return {
    ...notes,
    markdown: {
      extensions: [...(prompts ? [promptElementsExtension] : []), extension],
    },
    inlineReferences(block: Parameters<typeof notes.inlineReferences>[0]) {
      return [
        ...notes.inlineReferences(block),
        ...(block.kind !== "markdown"
          ? []
          : agentMentionReferences(block.text).map((ref) => ({
              from: ref.from,
              to: ref.to,
              decoration: Decoration.replace({
                widget: new AgentLink(props(ref.agentId, ref.label)),
              }).range(ref.from, ref.to),
            }))),
      ].sort((a, b) => a.from - b.from);
    },
  };
}
