// SPDX-License-Identifier: Apache-2.0
import type { TranscriptCommentThread } from "@lapismd/design-core/chat";
import { normalizePortableVaultPath } from "../conversations/paths.ts";
export type ConversationDraft = {
  text: string;
  attachments: { path: string; name: string }[];
  threads: TranscriptCommentThread[];
};
export const emptyDraft = (): ConversationDraft => ({
  text: "",
  attachments: [],
  threads: [],
});
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid saved draft");
  return value as Record<string, unknown>;
}
function text(value: unknown): string {
  if (typeof value !== "string") throw new Error("Invalid draft text");
  return value;
}
function offset(value: unknown): number {
  if (!Number.isSafeInteger(value) || Number(value) < 0)
    throw new Error("Invalid draft offset");
  return Number(value);
}
export function draftThreads(threads: readonly TranscriptCommentThread[]) {
  return threads
    .map((t) => ({
      ...t,
      comments: t.comments.filter((c) => c.status === "draft"),
    }))
    .filter((t) => t.comments.length);
}
export function parseDraft(value: unknown): ConversationDraft {
  const data = object(value);
  if (
    !Array.isArray(data.attachments) ||
    data.attachments.length > 100 ||
    !Array.isArray(data.threads) ||
    data.threads.length > 200
  )
    throw new Error("Invalid saved draft collections");
  return {
    text: text(data.text),
    attachments: data.attachments.map((value) => {
      const file = object(value);
      return {
        path: normalizePortableVaultPath(text(file.path)),
        name: text(file.name),
      };
    }),
    threads: data.threads.map((value) => {
      const thread = object(value),
        anchor = object(thread.anchor);
      const from = offset(anchor.from),
        to = offset(anchor.to);
      if (
        to < from ||
        !Array.isArray(thread.comments) ||
        thread.comments.length > 200
      )
        throw new Error("Invalid draft comment");
      return {
        id: text(thread.id),
        label: text(thread.label),
        anchor: {
          blockId: text(anchor.blockId),
          revision: text(anchor.revision),
          from,
          to,
          quote: text(anchor.quote),
          ...(anchor.tableContext
            ? {
                tableContext: (() => {
                  const table = object(anchor.tableContext);
                  return {
                    markdown: text(table.markdown),
                    from: offset(table.from),
                    to: offset(table.to),
                  };
                })(),
              }
            : {}),
        },
        comments: thread.comments.map((value) => {
          const comment = object(value),
            author = object(comment.author);
          if (comment.status !== "draft")
            throw new Error("Only unsent comments belong in drafts");
          const edit = comment.editOf ? object(comment.editOf) : undefined;
          return {
            id: text(comment.id),
            text: text(comment.text),
            status: "draft" as const,
            author: { id: text(author.id), name: text(author.name) },
            ...(typeof comment.replyTo === "string"
              ? { replyTo: comment.replyTo }
              : {}),
            ...(edit
              ? {
                  editOf: {
                    commentId: text(edit.commentId),
                    messageId: text(edit.messageId),
                    version: text(edit.version),
                  },
                }
              : {}),
          };
        }),
      };
    }),
  };
}
