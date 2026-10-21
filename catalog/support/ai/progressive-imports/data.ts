import type { TranscriptEntry } from "../../../../src/lib/ai/conversations/types.ts";

export type Session = {
  id: string;
  title: string;
  folder: string;
  source: string;
  size: string;
  updated: string;
};
export const folders = [
  {
    path: "Projects/Lapis Notes",
    location: "~/Projects/lapis-notes",
    count: 3,
  },
  {
    path: "Projects/Design Core",
    location: "~/Projects/design-core",
    count: 2,
  },
  {
    path: "Archive/Retired Vault",
    location: "~/Archive/retired-vault",
    count: 0,
  },
];
export const sessions: Session[] = [
  {
    id: "weekly",
    title: "Weekly review and follow-ups",
    folder: folders[0].path,
    source: "Codex CLI",
    size: "24.9 MiB",
    updated: "Today, 09:12",
  },
  {
    id: "links",
    title: "Connect the research notes",
    folder: folders[0].path,
    source: "Codex Desktop",
    size: "3.2 MiB",
    updated: "Yesterday, 16:20",
  },
  {
    id: "decisions",
    title: "Extract project decisions",
    folder: folders[0].path,
    source: "Codex CLI",
    size: "1.8 MiB",
    updated: "Yesterday, 11:04",
  },
  {
    id: "tabs",
    title: "Responsive settings tabs",
    folder: folders[1].path,
    source: "Codex Desktop",
    size: "8.1 MiB",
    updated: "Today, 08:40",
  },
  {
    id: "avatars",
    title: "Agent avatar presentation",
    folder: folders[1].path,
    source: "Codex CLI",
    size: "0.7 MiB",
    updated: "Monday, 14:32",
  },
];
export function sessionPath(session: Session) {
  return `${session.folder}/${session.id}.jsonl`;
}
export function transcript(session: Session): TranscriptEntry[] {
  const texts =
    session.id === "weekly"
      ? [
          "Help me review this week's notes and organise the follow-ups.",
          "I'll start with the decisions and open questions, then collect the next actions.",
          "Keep the review concise and link each action to its source note.",
          "## Weekly review\n\nThe project has a clear outline. Group the review into **decisions**, **open questions** and **next actions**.\n\n- Confirm the release scope.\n- Link the research notes.\n- Assign the unresolved follow-ups.",
          "Which follow-up should I prioritise?",
          "Start with the release decision. It determines which of the remaining actions are necessary this week.",
        ]
      : [
          `Review the captured work: ${session.title}.`,
          `## ${session.title}\n\nKeep related notes connected with clear names and short summaries.`,
          "Preserve the existing structure and call out the unresolved decisions.",
          "The existing structure is retained. The remaining questions are grouped next to the relevant notes.",
          "Summarise the next action.",
          "Confirm the outstanding decision, then update its linked note.",
        ];
  return texts.map((text, index) => ({
    schemaVersion: 3,
    id: `${session.id}-${index}`,
    type: "message",
    role: index % 2 ? "assistant" : "user",
    text,
    createdAt: `2026-10-21T09:12:${String(index * 3).padStart(2, "0")}.000Z`,
  }));
}
