<script lang="ts">
  import { untrack } from "svelte";
  import NotesDemo from "../NotesDemo.svelte";
  import {
    bindNativeRemotes,
    nativeRemotesFixture,
    type Scenario,
  } from "./native-remotes.ts";
  let { scenario = "connected" }: { scenario?: Scenario } = $props();
  const fixture = untrack(() => nativeRemotesFixture(scenario));
  let root: HTMLDivElement;
</script>

<div bind:this={root} data-native-remotes-fixture style="height:100%">
  <NotesDemo
    createRepository={(app) => {
      bindNativeRemotes(root, fixture);
      return fixture.services(app);
    }}
  />
</div>
