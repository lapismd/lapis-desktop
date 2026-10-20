// SPDX-License-Identifier: Apache-2.0
// Adapted from JJ Store's exact setup-ID codec and Markdown mention links.
import { language } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { createMiraMarkdownLanguage } from "@lapismd/mira/codemirror";
import {
  agentMentionMatches,
  agentMentionToken,
} from "@lapismd/jj-conversations";

const parser = EditorState.create({
  extensions: createMiraMarkdownLanguage(),
}).facet(language)!.parser;

export type AgentMentionReference = {
  from: number;
  to: number;
  agentId: string;
  label?: string;
};

/** Human-readable Markdown, separate from saved recipient/routing metadata. */
export function formatAgentMention(id: string, label: string): string {
  const token = agentMentionToken(id);
  if (agentMentionMatches(token)[0]?.agentId !== id)
    throw new Error("Invalid agent mention identity");
  const name = label.replace(/[\r\n]+/gu, " ").replace(/[\\[\]]/gu, "\\$&");
  return `[${name}](lapis://agent:${token.slice("jj-store-agent:".length, -1)})`;
}

export function agentIdFromHref(href: string): string | undefined {
  const hex = /^lapis:\/\/agent:([0-9a-f]+)$/u.exec(href)?.[1];
  const token = hex
    ? `jj-store-agent:${hex};`
    : href.startsWith("agent:")
      ? `jj-store-${href}`
      : href;
  const match = agentMentionMatches(token)[0];
  return match?.value === token ? match.agentId : undefined;
}

/** Both bare spellings retain the SDK's strict UTF-8 setup identity. */
export function bareAgentMentionReferences(
  text: string,
): AgentMentionReference[] {
  return [...text.matchAll(/(?:jj-store-)?agent:[0-9a-f]{2,512};/gu)].flatMap(
    (match) => {
      if (
        /[\p{L}\p{N}_:/-]/u.test(text[match.index - 1] ?? "") ||
        /\\*$/u.exec(text.slice(0, match.index))![0].length % 2
      )
        return [];
      const agentId = agentIdFromHref(match[0]);
      return agentId
        ? [{ from: match.index, to: match.index + match[0].length, agentId }]
        : [];
    },
  );
}

/** Preserve source offsets and code examples; old messages are never rewritten. */
export function agentMentionReferences(text: string): AgentMentionReference[] {
  const references: AgentMentionReference[] = [];
  const excluded: { from: number; to: number }[] = [];
  parser.parse(text).iterate({
    enter(node) {
      if (
        [
          "FencedCode",
          "CodeBlock",
          "InlineCode",
          "Image",
          "HTMLBlock",
          "HTMLTag",
        ].includes(node.name)
      ) {
        excluded.push({ from: node.from, to: node.to });
        return false;
      }
      if (node.name !== "Link") return;
      excluded.push({ from: node.from, to: node.to });
      const link = /^\[((?:\\.|[^\]\\])+)\]\(([^\s)]+)\)$/u.exec(
        text.slice(node.from, node.to),
      );
      const agentId = link && agentIdFromHref(link[2]!);
      if (agentId)
        references.push({
          from: node.from,
          to: node.to,
          agentId,
          label: link![1]!.replace(/\\([\p{P}\p{S}])/gu, "$1"),
        });
      return false;
    },
  });
  for (const match of bareAgentMentionReferences(text)) {
    if (
      excluded.some((range) => match.from < range.to && match.to > range.from)
    )
      continue;
    const backslashes = /\\*$/u.exec(text.slice(0, match.from))![0].length;
    if (backslashes % 2) continue;
    references.push({
      from: match.from,
      to: match.to,
      agentId: match.agentId,
    });
  }
  return references.sort((a, b) => a.from - b.from);
}
