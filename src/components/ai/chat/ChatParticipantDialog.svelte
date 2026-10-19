<script lang="ts">
  import * as Dialog from "@lapismd/design-core/shadcn/dialog";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Input } from "@lapismd/design-core/shadcn/input";
  import * as Field from "@lapismd/design-core/shadcn/field";
  import { Label } from "@lapismd/design-core/shadcn/label";
  import type { AiChatPanelProps } from "../../../lib/ai/chat/panel/props.ts";
  import type { AiChatController } from "../../../lib/ai/chat/chat-controller.svelte.ts";
  import { validateAgentParticipants } from "../../../lib/ai/settings/participants.ts";
  import { normalizeAcpAgent } from "../../../lib/ai/settings/acp-agents.ts";
  let {
    open = $bindable(false),
    panelProps,
    controller,
  }: {
    open?: boolean;
    panelProps: AiChatPanelProps;
    controller: AiChatController;
  } = $props();
  let label = $state(""),
    saving = $state(false);
  const agent = $derived(normalizeAcpAgent(panelProps.settings?.acpAgent));
  const nameId = $props.id();
  async function save() {
    if (saving || !label.trim() || !panelProps.onSettingsChange) return;
    saving = true;
    try {
      const participants = validateAgentParticipants([
        ...(panelProps.settings?.agentParticipants ?? [
          {
            id: agent,
            label: { codex: "Codex", cursor: "Cursor", opencode: "OpenCode" }[
              agent
            ],
            agent,
          },
        ]),
        {
          id: `participant-${crypto.randomUUID()}`,
          label: label.trim(),
          agent,
        },
      ]);
      await panelProps.onSettingsChange!({ agentParticipants: participants });
      await panelProps.app?.notifications.clear("ai-participant-save");
      label = "";
      open = false;
    } catch (error) {
      panelProps.app?.notifications.notify({
        id: "ai-participant-save",
        title: "AI",
        source: "ai",
        severity: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      saving = false;
    }
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content>
    <Dialog.Header
      ><Dialog.Title>Add agent participant</Dialog.Title><Dialog.Description
        >Create a named participant using {agent}. It keeps its own conversation
        context and uses the same admitted agent and approvals.</Dialog.Description
      ></Dialog.Header
    >
    <form
      onsubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <Field.Group
        ><Field.Field
          ><Label for={nameId}>Participant name</Label>
          <Input
            id={nameId}
            bind:value={label}
            maxlength={80}
            required
            disabled={saving || controller.busy}
          /></Field.Field
        ></Field.Group
      >
      <Dialog.Footer
        ><Button
          type="submit"
          disabled={saving || controller.busy || !label.trim()}
          >Add participant</Button
        ></Dialog.Footer
      >
    </form>
  </Dialog.Content>
</Dialog.Root>
