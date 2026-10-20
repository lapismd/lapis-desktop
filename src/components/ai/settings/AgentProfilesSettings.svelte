<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { ConfirmDialog } from "@lapismd/design-core/forms/dialog";
  import AgentProfilesGallery from "./AgentProfilesGallery.svelte";
  import ChatParticipantDialog from "../chat/ChatParticipantDialog.svelte";
  import type {
    AgentProfileEditorContext,
    AgentProfileManagement,
  } from "../../../lib/ai/settings/agent-profile-editor.ts";
  import type { AgentRecipientOption } from "../../../lib/ai/conversations/recipients.ts";
  let { management }: { management: AgentProfileManagement } = $props();
  let settings = $state(untrack(() => management.settings.get()));
  let editing = $state<AgentRecipientOption>(),
    removing = $state<AgentRecipientOption>();
  let editorOpen = $state(false),
    removeOpen = $state(false),
    pending = $state(false);
  const context: AgentProfileEditorContext = $derived({
    app: management.app,
    settings,
    onSettingsChange: management.update,
    loadModels: management.loadModels,
  });
  onMount(() => {
    const owner = management;
    settings = owner.settings.get();
    return owner.settings.subscribe(() => {
      settings = owner.settings.get();
    });
  });
  async function remove() {
    if (!removing || pending) return false;
    pending = true;
    try {
      await management.remove(removing.id);
      await management.app.notifications.clear("ai-participant-remove");
      removing = undefined;
      return true;
    } catch (error) {
      management.app.notifications.notify({
        id: "ai-participant-remove",
        source: "ai",
        title: "AI",
        severity: "error",
        message: error instanceof Error ? error.message : String(error),
      });
      return false;
    } finally {
      pending = false;
    }
  }
</script>

<AgentProfilesGallery
  profiles={settings.agentParticipants ?? []}
  {pending}
  onAdd={() => {
    editing = undefined;
    editorOpen = true;
  }}
  onEdit={(profile) => {
    editing = profile;
    editorOpen = true;
  }}
  onRemove={(profile) => {
    removing = profile;
    removeOpen = true;
  }}
/>
<ChatParticipantDialog
  bind:open={editorOpen}
  participant={editing}
  panelProps={context}
/>
<ConfirmDialog
  bind:open={removeOpen}
  title={`Remove ${removing?.label ?? "agent"}?`}
  description="This removes the saved agent profile from this vault. Existing conversations and their recorded author identities remain available."
  confirmLabel="Remove agent"
  destructive
  {pending}
  onConfirm={remove}
/>
