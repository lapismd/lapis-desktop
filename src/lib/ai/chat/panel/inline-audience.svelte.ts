// SPDX-License-Identifier: Apache-2.0
import {
  agentMentionReferences,
  formatAgentMention,
} from "../agent-mentions.ts";
import type { AgentRecipientOption } from "../../conversations/recipients.ts";
import type { ComposerRecipients } from "./recipients.svelte.ts";
type InlineAudience = {
  draft: string;
  recipientOptions: readonly AgentRecipientOption[];
  recipients: ComposerRecipients;
  insertReference(value: string): void;
};

export function appendInlineRecipient(composer: InlineAudience, id: string) {
  const option = composer.recipientOptions.find((option) => option.id === id);
  if (
    !option ||
    agentMentionReferences(composer.draft).some((match) => match.agentId === id)
  )
    return;
  composer.insertReference(formatAgentMention(option.id, option.label));
}
export function removeInlineRecipient(composer: InlineAudience, id?: string) {
  let text = composer.draft;
  for (const match of agentMentionReferences(text)
    .filter((match) => id === undefined || match.agentId === id)
    .reverse())
    text =
      text.slice(0, match.from) +
      text.slice(text[match.to] === " " ? match.to + 1 : match.to);
  composer.draft = text;
  composer.recipients.remove(id);
}
/** Editing or cancelling an inline tag updates only this draft's audience. */
export function observeInlineAudience(composer: InlineAudience) {
  $effect(() => {
    const ids = [
      ...new Set(
        agentMentionReferences(composer.draft).map((match) => match.agentId),
      ),
    ];
    if (!composer.recipients.matches(ids))
      composer.recipients.selectedIds = ids;
  });
}
