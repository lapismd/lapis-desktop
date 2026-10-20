// SPDX-License-Identifier: Apache-2.0
import { agentMentionMatches } from "@lapismd/jj-conversations";
import { recipientFromOption } from "../../conversations/recipients.ts";
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
    agentMentionMatches(composer.draft).some((match) => match.agentId === id)
  )
    return;
  composer.insertReference(recipientFromOption(option).token);
}
export function removeInlineRecipient(composer: InlineAudience, id?: string) {
  let text = composer.draft;
  for (const match of agentMentionMatches(text)
    .filter((match) => id === undefined || match.agentId === id)
    .reverse())
    text =
      text.slice(0, match.start) +
      text.slice(text[match.end] === " " ? match.end + 1 : match.end);
  composer.draft = text;
  composer.recipients.remove(id);
}
/** Editing or cancelling an inline tag updates only this draft's audience. */
export function observeInlineAudience(composer: InlineAudience) {
  $effect(() => {
    const ids = [
      ...new Set(
        agentMentionMatches(composer.draft).map((match) => match.agentId),
      ),
    ];
    if (!composer.recipients.matches(ids))
      composer.recipients.selectedIds = ids;
  });
}
