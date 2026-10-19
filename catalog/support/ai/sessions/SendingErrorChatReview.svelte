<script lang="ts">
  import { untrack } from "svelte";
  import type { TranscriptFrameProps } from "../../../../src/lib/ai/chat/panel/transcript.ts";
  import ChatSessionReview from "../../../../src/components/ai/sessions/AiChatSession.svelte";
  let props: TranscriptFrameProps = $props();
  let demonstrated = false;
  $effect(() => {
    const { panel } = props;
    if (
      demonstrated ||
      panel.panelProps.initializing ||
      panel.composerState.catalogState?.loading ||
      !panel.controller.location
    )
      return;
    demonstrated = true;
    untrack(() => {
      const prompt =
        "Summarize the open questions and suggest the next action.";
      panel.composerState.draft = prompt;
      void panel.actions.perform(() =>
        panel.controller.submit(prompt, {
          agent: panel.composerState.selectedAgent,
          model: {
            provider: panel.composerState.selectedAgent,
            model: panel.composerState.selectedModel,
          },
        }),
      );
    });
  });
</script>

<ChatSessionReview {...props} />
