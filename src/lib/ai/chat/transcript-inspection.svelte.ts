// SPDX-License-Identifier: Apache-2.0
import type { TranscriptTool } from "@lapismd/design-core/chat";
import { untrack } from "svelte";
import type { TranscriptPanelProps } from "./panel/transcript.ts";
import { projectAiTranscript } from "./transcript-projection.ts";
import { previewTranscriptTool } from "./transcript-tool-preview.ts";
import { resolveToolResultView } from "./chat-result-views.ts";

/** Host-owned review presentation; dispatch, persistence and the controller stay unchanged. */
export function transcriptToolInspection(
  panel: () => TranscriptPanelProps,
  enabled: () => boolean,
) {
  const owner = $derived(JSON.stringify(panel().controller.location));
  let current = $state<{ id: string; opener: HTMLElement; owner: string }>();
  $effect(() => {
    if (current && current.owner !== owner)
      untrack(() => {
        current = undefined;
      });
  });
  const items = $derived.by(() => {
    const { controller, panelProps, composerState } = panel();
    const projected = projectAiTranscript(
      controller.items,
      controller.bindings,
      composerState.recipientOptions,
      controller.sentContexts.value,
    );
    if (!enabled()) return projected;
    const source = new Map(controller.items.map((item) => [item.id, item]));
    return projected.map((item) => ({
      ...item,
      dayLabel: controller.bindings.length === 1 ? undefined : item.dayLabel,
      tools: item.tools?.map((tool) => {
        const original = source.get(tool.id);
        return original?.type === "tool"
          ? previewTranscriptTool(
              tool,
              original,
              !!resolveToolResultView(panelProps.app, original.name),
            )
          : tool;
      }),
    }));
  });
  const tool = $derived(
    enabled()
      ? items
          .flatMap((item) => item.tools ?? [])
          .find((tool) => tool.id === current?.id)
      : undefined,
  );
  return {
    get items() {
      return items;
    },
    get tool() {
      return tool;
    },
    get opener() {
      return current?.opener;
    },
    open(tool: TranscriptTool, opener: HTMLElement) {
      if (enabled()) current = { id: tool.id, opener, owner };
    },
    close() {
      current = undefined;
    },
  };
}
