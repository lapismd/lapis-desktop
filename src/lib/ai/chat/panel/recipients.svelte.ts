import {
  recipientFromOption,
  type AgentRecipientOption,
} from "../../conversations/recipients.ts";

/** Draft audience belongs to this composer, independently of a live binding. */
export class ComposerRecipients {
  selectedId = $state<string | null>(null);
  constructor(readonly options: () => readonly AgentRecipientOption[]) {}
  select(id: string): void {
    if (!this.options().some((option) => option.id === id))
      throw new Error("The selected agent is no longer available");
    this.selectedId = id;
  }
  remove(): void {
    this.selectedId = null;
  }
  snapshot() {
    const id = this.selectedId;
    if (id === null) return undefined;
    const option = this.options().find((entry) => entry.id === id);
    if (!option)
      throw new Error(
        "The addressed agent is no longer available. Remove it or select an agent again.",
      );
    return {
      id,
      agent: option.agent,
      recipients: [recipientFromOption(option)],
    };
  }
  /** Saved labels remain visible if the live catalog changes; they confer no grant. */
  display = $derived.by(() => {
    if (this.selectedId === null) return [];
    const option = this.options().find((entry) => entry.id === this.selectedId);
    return option
      ? [recipientFromOption(option)]
      : [{ id: this.selectedId, token: "", label: "Unavailable agent" }];
  });
}
