import type { TranscriptController } from "@lapismd/design-core/chat";
import type { ComposerState } from "./composer.svelte.ts";
import { formatAgentMention } from "../agent-mentions.ts";

export async function sendTranscript(
  composerState: ComposerState,
  commentState: TranscriptController,
  blocked: boolean,
) {
  const value = composerState.draft;
  const draftKey = composerState.draftKey;
  const followup = composerState.automaticallyMentionAgents
    ? composerState.recipients.display
        .map((recipient) => formatAgentMention(recipient.id, recipient.label))
        .join(" ")
    : "";
  if (blocked || (!value.trim() && !commentState.pending.length)) return;
  commentState.message = value;
  const accepted = await commentState.send();
  if (
    accepted &&
    composerState.matchesDraft(draftKey) &&
    composerState.draft === value
  )
    composerState.draft = followup ? `${followup} ` : "";
}
