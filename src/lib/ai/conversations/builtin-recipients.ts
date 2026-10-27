import catalog from "../../../../config/ai/queue-recipients.json";

/** Existing builtin attribution declaration, shared with the sealed native host. */
export function builtinRecipientLabel(agent: string | undefined): string {
  return catalog.find((entry) => entry.runner === agent)?.recipient.label ?? "";
}
