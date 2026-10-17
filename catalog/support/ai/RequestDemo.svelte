<script lang="ts">
  import AiApprovalCard from "../../../src/components/ai/chat/AiApprovalCard.svelte";
  import AiQuestionCard from "../../../src/components/ai/chat/AiQuestionCard.svelte";
  import QuestionRequests from "./QuestionRequests.svelte";
  import type {
    ApprovalRequest,
    UserInputAnswers,
  } from "../../../src/lib/ai/core/approvals.ts";
  let {
    mode = "permission",
    request,
    disabled = false,
    onRespond = () => {},
    onAnswer = () => {},
  }: {
    mode?: "permission" | "question" | "fresh";
    request?: ApprovalRequest;
    disabled?: boolean;
    onRespond?: (id: string) => void;
    onAnswer?: (answers: UserInputAnswers) => void;
  } = $props();
</script>

{#if mode === "permission" && request}
  <AiApprovalCard {request} {disabled} {onRespond} />
{:else if mode === "question"}
  <AiQuestionCard
    request={{
      id: "question",
      title: "Choose a format",
      questions: [
        {
          id: "format",
          header: "Format",
          prompt: "Choose a format",
          allowOther: true,
          secret: false,
          options: [{ id: "short", label: "Brief" }],
        },
      ],
    }}
    {disabled}
    onRespond={onAnswer}
  />
{:else if mode === "fresh"}
  <QuestionRequests />
{/if}
