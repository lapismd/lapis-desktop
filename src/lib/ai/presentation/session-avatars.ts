import type { AvatarIdentity } from "@lapismd/design-core/shadcn/avatar";
import type { AgentRecipientOption } from "../conversations/recipients.ts";
import type { AgentBindingCreatedRecord } from "../conversations/types.ts";
import { agentAvatar } from "./agent-avatar.ts";
const labels: Record<string, string> = {
  codex: "Codex",
  cursor: "Cursor",
  opencode: "OpenCode",
  local: "Lapis AI",
};
/** Conversation participants plus the current draft audience; unrelated saved profiles stay out. */
export function sessionAvatars(
  agent: string,
  selected: readonly string[],
  profiles: readonly AgentRecipientOption[],
  bindings: readonly AgentBindingCreatedRecord[],
): AvatarIdentity[] {
  const people = new Map<string, { id: string; name: string; agent: string }>();
  for (const binding of bindings) {
    const id = binding.participant?.id ?? binding.agent;
    if (id && binding.agent)
      people.set(id, {
        id,
        name:
          binding.participant?.label ?? labels[binding.agent] ?? binding.agent,
        agent: binding.agent,
      });
  }
  for (const id of selected) {
    const profile = profiles.find((p) => p.id === id);
    if (profile)
      people.set(id, { id, name: profile.label, agent: profile.agent });
  }
  if (
    !selected.length &&
    ![...people.values()].some((person) => person.agent === agent)
  )
    people.set(agent, { id: agent, name: labels[agent] ?? agent, agent });
  return [...people.values()].map((person) => {
    const profile = profiles.find((p) => p.id === person.id);
    return {
      id: person.id,
      name: profile?.label ?? person.name,
      src: profile?.avatar ?? agentAvatar(person.agent),
      background: profile?.avatarBackground,
      shape: "rounded",
    };
  });
}
