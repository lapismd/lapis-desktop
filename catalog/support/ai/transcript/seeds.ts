import type { AiChatItem } from "../../../../src/lib/ai/chat/chat-items.ts";

const time = (minute: number) =>
  `2026-10-18T09:${String(minute).padStart(2, "0")}:00.000Z`;
const summary = `## A quieter daily review

Your notes point to three useful changes:

1. **Keep capture quick.** Put new observations into an inbox before assigning a project.
2. **Make decisions discoverable.** Record the outcome, the reason and the next action together.
3. **Review the week as a whole.** A short retrospective will expose repeated blockers.

### Suggested note structure

\`\`\`markdown
# Daily review

## What changed?
## Decisions and reasons
## Next small action
\`\`\`

The important distinction is between an observation and an action. Keep the original observation intact, then link it to the action you choose. That keeps your history useful when a plan changes.

| Area | Next action | When |
| --- | --- | --- |
| Research | Link the three open questions | Tomorrow |
| Writing | Draft the introduction | This week |
| Planning | Review the inbox | Friday |

No source notes need to change to try this. Start with one review, then adjust the headings after a few days.`;

/** Catalog-only conversation; no captured/provider data enters the app. */
export function transcriptReviewItems(longCode = false): AiChatItem[] {
  return [
    {
      id: "review-request",
      type: "message",
      role: "user",
      text: "Read my daily review notes and suggest a simpler way to track decisions. Please keep the existing notes intact.",
      createdAt: time(10),
    },
    {
      id: "review-context",
      type: "status",
      text: "Captured file context\n\nNotes/alpha.md\n\n# Notes\n\nTODO: summarize this note.\n\nThis recorded context is separate from the authored request.",
      createdAt: time(10),
    },
    {
      id: "review-reasoning",
      type: "thinking",
      kind: "summary",
      text: "I will compare the headings and open questions, then suggest a lightweight structure without editing the notes.",
      state: "done",
      createdAt: time(10),
    },
    {
      id: "review-read",
      type: "tool",
      toolId: "review-read",
      name: "vault.read",
      input: '{"path":"Notes/alpha.md"}',
      output: "# Notes\n\nTODO: summarize this note.",
      state: "completed",
      createdAt: time(11),
    },
    {
      id: "review-search",
      type: "tool",
      toolId: "review-search",
      name: "notes_search",
      input: '{"query":"decisions"}',
      output: JSON.stringify({
        hits: [
          {
            path: "Notes/alpha.md",
            title: "alpha",
            snippet: "TODO: summarize this note.",
            score: 1,
          },
        ],
      }),
      state: "completed",
      createdAt: time(11),
    },
    {
      id: "review-response",
      type: "message",
      role: "assistant",
      text: longCode
        ? summary.replace(
            /```markdown[\s\S]*?```/,
            "```typescript\n" +
              Array.from(
                { length: 60 },
                (_, index) =>
                  `export const setting${index + 1} = "value ${index + 1}";`,
              ).join("\n") +
              "\n```",
          )
        : summary,
      createdAt: time(12),
    },
    {
      id: "review-followup",
      type: "message",
      role: "user",
      text: "How would I use this if a project gets paused for a month?",
      createdAt: time(15),
    },
    {
      id: "review-second-response",
      type: "message",
      role: "assistant",
      text: "Keep a short **resume note**: the last decision, the next action and any assumptions that may expire. When you return, validate those assumptions before continuing.\n\n> A useful checkpoint tells your future self why the next step matters.\n\nYou can link that checkpoint from the project note without rewriting its earlier history.",
      createdAt: time(16),
    },
  ];
}
