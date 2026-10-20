<!-- SPDX-License-Identifier: Apache-2.0; shared production message input. -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import {
    MarkdownComposer,
    type MarkdownComposerHandle,
  } from "@lapismd/design-core/chat";
  import { Avatar } from "@lapismd/design-core/shadcn/avatar";
  import type { ComposerTrigger } from "@lapismd/design-core/ai/chat";
  import type { AgentRecipientOption } from "../../../lib/ai/conversations/recipients.ts";
  import { composerReferences } from "./composer-references.ts";
  let {
    value = $bindable(""),
    documentActions = $bindable(),
    view,
    disabled = false,
    framedDrawer = false,
    showHint = true,
    triggers = [],
    agentOptions = [],
    people = [],
    handle = $bindable(null),
    before,
    drawer,
    onSend,
  }: {
    value?: string;
    documentActions?: Snippet;
    view: "document" | "classic";
    disabled?: boolean;
    framedDrawer?: boolean;
    showHint?: boolean;
    triggers?: ComposerTrigger[];
    agentOptions?: readonly AgentRecipientOption[];
    people?: readonly import("../../../lib/ai/conversations/recipients.ts").ComposerPersonOption[];
    handle?: MarkdownComposerHandle | null;
    before?: Snippet;
    drawer?: Snippet;
    onSend(): void;
  } = $props();
  const references = composerReferences(
    () => agentOptions,
    () => people,
  );
</script>

<div class="transcript-composer">
  {@render before?.()}
  <MarkdownComposer
    bind:handle
    {...framedDrawer ? { drawer } : {}}
    interactiveDrawerWhenDisabled
    bind:value
    bind:documentActions
    presentation={view === "document" ? "document" : "framed"}
    dockActions={view === "document"}
    showSendButton={false}
    {showHint}
    submitOnEnter={false}
    label="Message composer"
    inputLabel="Message"
    placeholder="Ask about your notes…"
    {disabled}
    {triggers}
    extensions={[references]}
    onSubmit={() => {
      if (!disabled) onSend();
    }}
  >
    {#snippet avatar()}<Avatar
        name="You"
        initials="YO"
        size="sm"
        decorative
      />{/snippet}
  </MarkdownComposer>
</div>

<style>
  .transcript-composer {
    --ui-markdown-composer-min-height: calc(2 * 1.4rem + 1rem);
    --ui-markdown-composer-document-min-height: calc(2 * 0.875rem * 1.65);
    display: grid;
    gap: 0.5rem;
    min-width: 0;
  }
</style>
