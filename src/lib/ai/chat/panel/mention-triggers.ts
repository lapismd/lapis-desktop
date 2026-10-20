import type { ComposerTrigger } from "@lapismd/design-core/ai/chat";
import { formatFileMention } from "../chat-mentions.ts";
import { recipientFromOption } from "../../conversations/recipients.ts";
import PinIcon from "@lucide/svelte/icons/pin";
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
    menuLabel: "People, agents and files",
    emptySearchResultsText: "No people, agents or vault files",
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
          description: `${option.agent} · ${option.model ?? "Default model"}`,
          avatar: {
            id: option.id,
            name: option.label,
            src: option.avatar,
            background: option.avatarBackground,
            shape: "rounded" as const,
          },
        }));
      const files = fileSearch ? await fileSearch(query, signal) : [];
      signal.throwIfAborted();
      return [
        ...(!query || /automatic|follow|tag/iu.test(query)
          ? [
              {
                id: "toggle:auto-mentions",
                label: "Automatically tag agents",
                description: composer.automaticallyMentionAgents
                  ? "On · Keep these agents in follow-up messages"
                  : "Off · Choose agents for each message",
                icon: PinIcon,
              },
            ]
          : []),
        ...agents,
        ...(props.mentionPeople ?? [])
          .filter((person) => person.label.toLocaleLowerCase().includes(needle))
          .map((person) => ({
            id: `person:${person.id}`,
            label: person.label,
            description: "Person",
            value: person.value,
            avatar: {
              id: person.id,
              name: person.label,
              src: person.avatar,
              background: person.avatarBackground,
            },
          })),
        ...files.map((file) => ({ ...file, id: `file:${file.id}` })),
      ].slice(0, 24);
    },
    onSelect: (item) => {
      if (item.id === "toggle:auto-mentions") {
        composer.setAutomaticallyMentionAgents(
          !composer.automaticallyMentionAgents,
        );
        return "";
      }
      if (item.id.startsWith("person:")) return `${item.value ?? item.label} `;
      if (item.id.startsWith("agent:")) {
        const id = item.id.slice(6);
        composer.selectRecipient(id, false);
        const option = composer.recipientOptions.find(
          (option) => option.id === id,
        );
        return option ? `${recipientFromOption(option).token} ` : "";
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
