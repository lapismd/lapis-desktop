// SPDX-License-Identifier: Apache-2.0
/** Exact outgoing context is inspectable for this controller lifetime, never stored. */
export type SentContextCapture = {
  bindingId: string;
  label: string;
  content: string;
  delivery: "prepared" | "sent" | "failed" | "unknown";
};
export type SentContextPreviews = Readonly<
  Record<string, readonly SentContextCapture[]>
>;

export class LiveSentContexts {
  value = $state.raw<SentContextPreviews>({});

  forMessage(userId: string, bindingId: string, label: string) {
    return {
      prepared: (content?: string) => {
        if (!content?.trim()) return;
        const current = this.value[userId] ?? [];
        this.value = {
          ...this.value,
          [userId]: [
            ...current.filter((entry) => entry.bindingId !== bindingId),
            { bindingId, label, content, delivery: "prepared" },
          ],
        };
      },
      settle: (delivery: SentContextCapture["delivery"]) => {
        const current = this.value[userId];
        if (!current?.some((entry) => entry.bindingId === bindingId)) return;
        this.value = {
          ...this.value,
          [userId]: current.map((entry) =>
            entry.bindingId === bindingId && entry.delivery !== "sent"
              ? { ...entry, delivery }
              : entry,
          ),
        };
      },
    };
  }
}

export function projectSentContext(captures?: readonly SentContextCapture[]) {
  if (!captures?.length) return;
  const delivery = (["unknown", "failed", "prepared", "sent"] as const).find(
    (value) => captures.some((entry) => entry.delivery === value),
  )!;
  return {
    content:
      captures.length === 1
        ? captures[0]!.content
        : captures
            .map(
              (entry) =>
                `## Context for ${entry.label} (${entry.delivery})\n\n${entry.content}`,
            )
            .join("\n\n"),
    rawContent: JSON.stringify(captures, null, 2),
    rawLanguage: "json",
    delivery,
  };
}
