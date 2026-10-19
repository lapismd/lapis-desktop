import type { ComposerTrigger } from "@lapismd/design-core/ai/chat";
import { formatFileMention } from "../chat-mentions.ts";
import { composerAgentLabel } from "../../commands/agent.ts";
import {
  composerSlashItems,
  filterComposerSlashItems,
} from "../../commands/groups.ts";
import type { AiChatController } from "../chat-controller.svelte.ts";
import type { AiChatPanelProps } from "./props.ts";
import type { ComposerState } from "./composer.svelte.ts";

/** Adapt jj-store's addressed-agent selection; file and setup namespaces differ. */
export function mentionTriggers(
  props: AiChatPanelProps,
  composer: ComposerState,
  controller: AiChatController,
): ComposerTrigger[] {
  const { slashRouter, fileSearch } = props;
  const triggers: ComposerTrigger[] = [];
  if (slashRouter)
    triggers.push({
      character: "/",
      menuLabel: "Commands",
      emptySearchResultsText: "No commands",
      searchSource: (query) =>
        filterComposerSlashItems(
          composerSlashItems(
            slashRouter.catalog.list(controller.activeBindingId),
            composerAgentLabel(
              composer.selectedAgent,
              composer.selectedRuntime,
            ),
          ),
          query,
        ),
      onSelect: (item) =>
        item.submitOnSelect
          ? (item.value ?? `/${item.id}`)
          : `${item.value ?? `/${item.id}`} `,
    });
  triggers.push({
    character: "@",
    menuLabel: "Agents and files",
    emptySearchResultsText: "No agents or vault files",
    searchSource: async (query, signal) => {
      const needle = query.toLowerCase();
      const agents = composer.recipientOptions
        .filter(
          (option) =>
            option.label.toLowerCase().includes(needle) ||
            option.id.toLowerCase().includes(needle),
        )
        .map((option) => ({
          id: `agent:${option.id}`,
          label: option.label,
          description: "Agent",
          avatar: {
            id: option.id,
            name: option.label,
            shape: "rounded" as const,
          },
        }));
      const files = fileSearch ? await fileSearch(query, signal) : [];
      signal.throwIfAborted();
      return [
        ...agents,
        ...files.map((file) => ({ ...file, id: `file:${file.id}` })),
      ].slice(0, 24);
    },
    onSelect: (item) => {
      if (item.id.startsWith("agent:")) {
        composer.selectRecipient(item.id.slice(6));
        return "";
      }
      const path = item.id.slice(5);
      return {
        value: item.value ?? formatFileMention(path),
        label: item.label,
        variant: "secondary",
      };
    },
  });
  return triggers;
}
