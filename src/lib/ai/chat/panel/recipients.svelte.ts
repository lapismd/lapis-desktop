import {
  recipientFromOption,
  type AgentRecipientOption,
} from "../../conversations/recipients.ts";
/** Draft audience belongs to this composer, independently of a live binding. */
export class ComposerRecipients {
  selectedIds = $state<string[]>([]);
  get selectedId() {
    return this.selectedIds.at(-1) ?? null;
  }
  set selectedId(id: string | null) {
    this.selectedIds = id === null ? [] : [id];
  }
  constructor(readonly options: () => readonly AgentRecipientOption[]) {}
  select(id: string) {
    if (!this.options().some((o) => o.id === id))
      throw new Error("The selected agent is no longer available");
    if (this.selectedIds.includes(id)) return;
    if (this.selectedIds.length >= 4)
      throw new Error("Select at most four agent recipients");
    this.selectedIds = [...this.selectedIds, id];
  }
  remove(id?: string) {
    this.selectedIds =
      id === undefined ? [] : this.selectedIds.filter((v) => v !== id);
  }
  snapshot() {
    if (!this.selectedIds.length) return;
    const options = this.selectedIds.map((id) => {
      const option = this.options().find((o) => o.id === id);
      if (!option)
        throw new Error(
          "The addressed agent is no longer available. Remove it or select an agent again.",
        );
      return option;
    });
    return {
      id: options.at(-1)!.id,
      agent: options[0]!.agent,
      recipients: options.map(recipientFromOption),
      options,
    };
  }
  matches(ids: readonly string[]) {
    return JSON.stringify(this.selectedIds) === JSON.stringify(ids);
  }
  display = $derived.by(() =>
    this.selectedIds.map((id) => {
      const option = this.options().find((o) => o.id === id);
      return option
        ? recipientFromOption(option)
        : { id, token: "", label: "Unavailable agent" };
    }),
  );
}
