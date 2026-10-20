import type { AgentRecipientOption } from "../../../../src/lib/ai/conversations/recipients.ts";
// Match the shared picker's portable emoji representation; fixtures own this data.
const image = (glyph: string, color: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" data-avatar-text="${glyph}" viewBox="0 0 256 256"><rect width="256" height="256" fill="${color}"/><text x="128" y="162" font-family="system-ui,sans-serif" font-size="112" text-anchor="middle" fill="white">${glyph}</text></svg>`)}`;
export const agentReviewProfiles: AgentRecipientOption[] = [
  {
    id: "reviewer",
    label: "Reviewer",
    description: "Reviews notes for accuracy and clarity",
    instructions:
      "Keep the author’s examples. Explain proposed changes before editing.",
    executionMode: "read-only",
    agent: "codex",
    model: "gpt-5.6-sol",
    thinking: "high",
    avatar: image("🦉", "#6e56cf"),
    avatarBackground: "#6e56cf",
  },
  {
    id: "writer",
    label: "Writer",
    description: "Drafts and improves notes",
    instructions: "Write clearly and preserve the author’s voice.",
    agent: "codex",
    thinking: "medium",
    avatar: image("✍️", "#3b82f6"),
    avatarBackground: "#3b82f6",
  },
];
