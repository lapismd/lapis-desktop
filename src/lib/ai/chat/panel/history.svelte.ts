import { onDestroy, untrack } from "svelte";
import { AiHistoryInspection } from "../history-inspection.svelte.ts";
import type { TranscriptPanelProps } from "./transcript.ts";

export function chatHistoryInspection(panel: () => TranscriptPanelProps) {
  const history = untrack(() => panel().controller.fileHistory);
  const inspection = new AiHistoryInspection(history);
  onDestroy(() => {
    const closing = inspection.dispose();
    panel().panelProps.onControllerDispose?.(closing);
  });
  $effect(() => {
    const location = panel().controller.location;
    let disposed = false;
    inspection.reset();
    void history
      .load(location)
      .then(() => {
        if (location && !disposed)
          return inspection.recoverUndo(location.conversationId);
      })
      .catch((error) => history.report(error));
    return () => {
      disposed = true;
    };
  });
  return inspection;
}
