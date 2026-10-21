import type { AiChatPanelProps } from "./props.ts";
export function saveTranscriptView(
  props: AiChatPanelProps,
  transcriptView: "document" | "classic",
) {
  const saving = Promise.resolve()
    .then(() => props.onSettingsChange?.({ transcriptView }))
    .catch((error) => {
      props.app?.notifications.notify({
        id: "ai-presentation-error",
        source: "ai",
        severity: "error",
        title: "Conversation view",
        message: error instanceof Error ? error.message : String(error),
      });
    });
  props.onOperation?.(saving);
}
