// SPDX-License-Identifier: Apache-2.0
import { syntaxTree } from "@codemirror/language";
import type { EditorState } from "@codemirror/state";
import { agentMentionMatches } from "@lapismd/jj-conversations";
import type { AgentRecipientOption } from "../conversations/recipients.ts";
import { transcriptNoteReferences } from "./transcript-note-references.ts";

export type ComposerReference = {
  from: number;
  to: number;
  label: string;
  title: string;
  kind: "agent" | "person" | "file" | "link";
  image?: string;
  background?: string;
  identityId?: string;
  description?: string;
};
/** Notes syntax stays host-owned; code examples and edited source remain literal. */
export function composerReferenceRanges(
  state: EditorState,
  profiles: readonly AgentRecipientOption[],
  people: readonly import("../conversations/recipients.ts").ComposerPersonOption[] = [],
): ComposerReference[] {
  const text = state.doc.toString();
  const ranges: ComposerReference[] = transcriptNoteReferences(text).map(
    (ref) => ({
      ...ref,
      label: ref.label.split("/").at(-1) || ref.label,
      title: ref.path,
      kind: "file",
    }),
  );
  for (const match of agentMentionMatches(text)) {
    const profile = profiles.find((profile) => profile.id === match.agentId);
    ranges.push({
      from: match.start,
      to: match.end,
      kind: "agent",
      label: profile?.label ?? "Unavailable agent",
      title: profile?.label ?? match.agentId,
      image: profile?.avatar,
      background: profile?.avatarBackground,
      identityId: match.agentId,
      description: profile
        ? `${profile.agent} · ${profile.model ?? "Default model"}`
        : "This saved agent is no longer in the current catalog.",
    });
  }
  syntaxTree(state).iterate({
    enter(node) {
      if (
        [
          "FencedCode",
          "CodeBlock",
          "InlineCode",
          "Image",
          "HTMLBlock",
        ].includes(node.name)
      )
        return false;
      if (node.name !== "Link") return;
      const match = /^\[([^\]]+)\]\(([^\s)]+)(?:\s+"[^"]*")?\)$/u.exec(
        text.slice(node.from, node.to),
      );
      if (match) {
        const person = people.find(
          (person) => person.value === text.slice(node.from, node.to),
        );
        ranges.push({
          from: node.from,
          to: node.to,
          label: person?.label ?? match[1]!,
          title: match[2]!,
          kind: person ? "person" : "link",
          image: person?.avatar,
          background: person?.avatarBackground,
          identityId: person?.id,
        });
      }
      return false;
    },
  });
  return ranges
    .filter((range) => {
      let node = syntaxTree(state).resolveInner(range.from, 1);
      for (;;) {
        if (
          ["FencedCode", "CodeBlock", "InlineCode", "HTMLBlock"].includes(
            node.name,
          )
        )
          return false;
        if (!node.parent) break;
        node = node.parent;
      }
      const selection = state.selection.main;
      return selection.empty
        ? !(selection.head > range.from && selection.head < range.to)
        : !(selection.from < range.to && selection.to > range.from);
    })
    .sort((a, b) => a.from - b.from || a.to - b.to);
}
