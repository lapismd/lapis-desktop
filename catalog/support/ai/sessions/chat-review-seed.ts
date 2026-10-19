// SPDX-License-Identifier: Apache-2.0
import {
  LOCAL_CONVERSATION_ID,
  ARCHIVED_CONVERSATION_ID,
} from "../shell/types.ts";

const capturedWelcome = `# Welcome to the project

Keep the daily review **short and useful**. Link each decision to the note that explains it.

## Next actions

- [x] Capture the current project context
- [ ] Review the open questions with the team
- [ ] Record the next small action
  - [X] Link the source notes
  - [ ] Explain the decision and its tradeoffs

| Area | Owner | Next step |
| --- | --- | --- |
| Research | Morgan | Link the three open questions |
| Writing | Riley | Draft the introduction |
| Planning | You | Review the inbox on Friday |

\`\`\`typescript
export function nextReview(days = 7): Date {
  const review = new Date();
  review.setDate(review.getDate() + days);
  return review;
}
\`\`\`

> Keep the original observation intact, then link it to the action you choose.

## Review cadence

1. [x] Capture the current project context
2. [ ] Revisit the open questions on Monday
3. [ ] Summarize the week's decisions on Friday

Keep completed tasks in this captured snapshot so the next review has the same context.
`;

/** Representative launch-note paths belong only to this disposable review vault. */
export function chatReviewSeed(
  files: Record<string, string>,
  longMessages = false,
) {
  if (longMessages) {
    const layout = JSON.parse(files[".lapis/workspace.json"]!);
    layout.left.width = "16rem";
    layout.right.width = "16rem";
    layout.right.children[0].children[0].state = {
      type: "ai-conversation-history",
      state: {},
      title: "Conversations",
      icon: "history",
    };
    files[".lapis/workspace.json"] = JSON.stringify(layout);
  }
  for (const [id, notePath] of [
    [LOCAL_CONVERSATION_ID, "Welcome.md"],
    [ARCHIVED_CONVERSATION_ID, "Archive/Planning/Release checklist.md"],
  ]) {
    const metadata = `Notes/.lapis/agents/sessions/${id}/metadata.yaml`;
    if (!files[metadata]) continue;
    files[metadata] +=
      `launchContext:\n  notePath: ${JSON.stringify(notePath)}\n`;
    files[`Notes/${notePath}`] ??= "# Review fixture\n";
  }
  const transcript = `Notes/.lapis/agents/sessions/${LOCAL_CONVERSATION_ID}/transcript.jsonl`;
  if (files[transcript])
    files[transcript] = files[transcript]
      .split("\n")
      .map((line) => {
        if (!line) return line;
        const entry = JSON.parse(line) as Record<string, unknown>;
        if (
          longMessages &&
          ["registry-user", "registry-assistant"].includes(String(entry.id))
        )
          return JSON.stringify({
            ...entry,
            text:
              "Review the complete set of workspace notes and explain which decisions still need supporting evidence. ".repeat(
                8,
              ) +
              "\n\n" +
              "captured-context-".repeat(25),
          });
        return entry.id === "registry-tool"
          ? JSON.stringify({
              ...entry,
              ...(longMessages
                ? {
                    input: JSON.stringify({
                      path:
                        "/Users/reviewer/code/lapismd/lapis-desktop-history/.local/demo-review/Repository Review/.agents/skills/lapis-notes/" +
                        "workspace-history-and-conversation-review-with-supporting-evidence-".repeat(
                          4,
                        ) +
                        "SKILL.md",
                    }),
                  }
                : {}),
              output: JSON.stringify({ content: capturedWelcome }),
            })
          : line;
      })
      .join("\n");
  return files;
}
