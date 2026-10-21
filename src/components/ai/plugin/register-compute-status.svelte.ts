import { mount, unmount, untrack } from "svelte";
import type { Plugin } from "@lapis-notes/api";
import type { AiCompute } from "../../../lib/ai/settings/compute.svelte.ts";
import AiComputeStatus from "./AiComputeStatus.svelte";

/** Reflect the owned compute controller; registration never starts or refreshes compute. */
export function registerComputeStatus(
  plugin: Pick<Plugin, "app" | "register"> & { compute?: AiCompute },
) {
  const management = plugin.compute;
  if (!management) return;
  plugin.register(
    $effect.root(() => {
      const running = $derived(management.value?.runtime.state === "serving");
      $effect(() => {
        if (!running) return;
        return untrack(() =>
          plugin.app.statusBar.registerItem({
            id: "ai:local-compute",
            sourcePlugin: "ai",
            alignment: "right",
            priority: 10,
            mount: (target) => {
              const component = mount(AiComputeStatus, {
                target,
                props: { management },
              });
              return () => {
                void unmount(component);
              };
            },
          }),
        );
      });
    }),
  );
}
