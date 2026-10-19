// SPDX-License-Identifier: Apache-2.0
import { language } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { createMiraMarkdownLanguage } from "@lapismd/mira/codemirror";
import { fileMentionRanges } from "./chat-mentions.ts";

const parser = EditorState.create({
  extensions: createMiraMarkdownLanguage(),
}).facet(language)!.parser;
export type NoteReference = {
  from: number;
  to: number;
  path: string;
  label: string;
};

/** Use Mira's syntax boundaries so examples, escapes and Markdown links stay literal. */
export function transcriptNoteReferences(text: string): NoteReference[] {
  const references: NoteReference[] = [];
  const excluded: { from: number; to: number }[] = [];
  parser.parse(text).iterate({
    enter(node) {
      if (
        [
          "FencedCode",
          "CodeBlock",
          "InlineCode",
          "Link",
          "Image",
          "Autolink",
          "HTMLBlock",
          "HTMLTag",
          "Table",
          "GridTable",
          "EmbedLink",
        ].includes(node.name)
      ) {
        excluded.push({ from: node.from, to: node.to });
        return false;
      }
      if (node.name !== "WikiLink") return;
      const [path = "", alias] = text
        .slice(node.from + 2, node.to - 2)
        .split("|");
      const mention =
        text[node.from - 1] === "@" &&
        (node.from === 1 || /\s/u.test(text[node.from - 2]!));
      references.push({
        from: node.from - (mention ? 1 : 0),
        to: node.to,
        path,
        label: alias || path,
      });
      return false;
    },
  });
  const overlaps = (
    a: { from: number; to: number },
    b: { from: number; to: number },
  ) => a.from < b.to && a.to > b.from;
  for (const mention of fileMentionRanges(text)) {
    if (![...excluded, ...references].some((range) => overlaps(mention, range)))
      references.push(mention);
  }
  return references.sort((a, b) => a.from - b.from);
}
