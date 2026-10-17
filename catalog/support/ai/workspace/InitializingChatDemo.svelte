<!-- SPDX-License-Identifier: Apache-2.0 -->
<script lang="ts">
  import AiChatPanel from "../../../../src/components/ai/chat/AiChatPanel.svelte";
  import { FakeAgentRuntime } from "../../../../tests/ai/support/fake-runtime.ts";
  import type { AppToolBridgeCoordinator } from "../../../../src/lib/ai/tools/app-tool-bridge.ts";
  let visible = $state(true);
  let subscriptions = $state(0);
  let closed = $state(false);
  const runtime = new FakeAgentRuntime({ id: "acp" });
  const bridge: AppToolBridgeCoordinator = {
    prepare: async () => {
      throw new Error("Initializing chat cannot start a session");
    },
    closeBinding: async () => {},
    respondToApproval: () => false,
    subscribe: () => {
      subscriptions += 1;
      return () => {
        subscriptions -= 1;
      };
    },
    close: async () => {},
  };
</script>

<button
  onclick={() => {
    visible = false;
  }}>Unmount initializing chat</button
>
<output aria-label="Initializing chat lifetime"
  >{JSON.stringify({ subscriptions, closed })}</output
>
{#if visible}
  <AiChatPanel
    {runtime}
    initializing={true}
    appToolBridge={bridge}
    onControllerDispose={(operation) => {
      void operation.then(() => {
        closed = true;
      });
    }}
  />
{/if}
