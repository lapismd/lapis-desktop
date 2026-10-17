<script lang="ts">
  import AiQuestionCard from "../../../src/components/ai/chat/AiQuestionCard.svelte";
  import type { UserInputRequest } from "../../../src/lib/ai/core/approvals.ts";
  let round = $state(1);
  const request = $derived<UserInputRequest>({
    id: `request-${round}`,
    title: "Question",
    questions: [
      {
        id: "shared-question",
        header: "Answer",
        prompt: `Private question ${round}`,
        allowOther: false,
        secret: true,
      },
    ],
  });
</script>

<AiQuestionCard
  {request}
  onRespond={() => {
    round += 1;
  }}
/>
