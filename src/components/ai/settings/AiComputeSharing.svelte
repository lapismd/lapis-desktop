<!-- Copied/adapted from jj-store StoreComputePeers. Device inference only. -->
<script lang="ts">
  import ComputeSettingRow from "./ComputeSettingRow.svelte";
  import * as Field from "@lapismd/design-core/shadcn/field";
  import * as Select from "@lapismd/design-core/shadcn/select";
  import { Switch } from "@lapismd/design-core/shadcn/switch";
  import { Textarea } from "@lapismd/design-core/shadcn/textarea";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import NetworkIcon from "@lucide/svelte/icons/network";
  import UnplugIcon from "@lucide/svelte/icons/unplug";
  import type { AiCompute } from "../../../lib/ai/settings/compute.svelte.ts";
  let { management }: { management: AiCompute } = $props();
  const id = $props.id();
  let invitation = $state("");
  let invalid = $state(false);
  const hostLabel = $derived(
    management.draft.targetPeer
      ? `${management.draft.targetPeer.slice(0, 12)}…`
      : "This machine",
  );
  const blocked = $derived(management.busy || management.pending);
  function pair() {
    try {
      const value = JSON.parse(invitation);
      if (typeof value.id !== "string" || !Array.isArray(value.addrs))
        throw Error();
      management.edit({
        peers: { ...management.draft.peers, [value.id]: value },
      });
      invitation = "";
      invalid = false;
    } catch {
      invalid = true;
    }
  }
</script>

<Field.Group style="gap:0">
  <ComputeSettingRow
    id={`${id}-share`}
    label="Share this machine"
    description="Only mutually paired machines can use inference. Application tools remain on the requesting device."
  >
    <Switch
      id={`${id}-share`}
      checked={management.draft.sharing}
      disabled={blocked}
      onCheckedChange={(sharing) => management.edit({ sharing })}
    />
  </ComputeSettingRow>
  <ComputeSettingRow
    id={`${id}-invitation`}
    label="This machine’s invitation"
    description="Available after an explicit compute action starts the local helper."
  >
    <Textarea
      id={`${id}-invitation`}
      readonly
      value={management.value?.runtime.invitation
        ? JSON.stringify(management.value.runtime.invitation)
        : "Not running"}
    />
  </ComputeSettingRow>
  <ComputeSettingRow
    id={`${id}-peer`}
    label="Pair a machine"
    description="Paste its invitation. Both devices must pair each other before sharing."
  >
    <Textarea
      id={`${id}-peer`}
      bind:value={invitation}
      disabled={blocked}
      aria-invalid={invalid}
    />
    {#if invalid}<Field.Error>Enter a valid machine invitation.</Field.Error
      >{/if}
    <Button
      variant="outline"
      size="sm"
      disabled={blocked || !invitation.trim()}
      onclick={pair}
      ><NetworkIcon data-icon="inline-start" aria-hidden="true" />Add paired
      machine</Button
    >
  </ComputeSettingRow>
  <ComputeSettingRow id={`${id}-host`} label="Inference host">
    <Select.Root
      type="single"
      value={management.draft.targetPeer ?? "local"}
      disabled={blocked}
      onValueChange={(value) =>
        management.edit({ targetPeer: value === "local" ? null : value })}
    >
      <Select.Trigger
        id={`${id}-host`}
        aria-label={`Inference host: ${hostLabel}`}>{hostLabel}</Select.Trigger
      >
      <Select.Content
        ><Select.Group
          ><Select.Item value="local">This machine</Select.Item
          >{#each Object.keys(management.draft.peers) as peer (peer)}<Select.Item
              value={peer}>{peer.slice(0, 12)}…</Select.Item
            >{/each}</Select.Group
        ></Select.Content
      >
    </Select.Root>
    {#each Object.keys(management.draft.peers) as peer (peer)}<Button
        variant="ghost"
        size="sm"
        disabled={blocked}
        onclick={() => {
          const peers = { ...management.draft.peers };
          delete peers[peer];
          management.edit({
            peers,
            targetPeer:
              management.draft.targetPeer === peer
                ? null
                : management.draft.targetPeer,
          });
        }}
        ><UnplugIcon data-icon="inline-start" aria-hidden="true" />Remove {peer.slice(
          0,
          12,
        )}…</Button
      >{/each}
  </ComputeSettingRow>
</Field.Group>
