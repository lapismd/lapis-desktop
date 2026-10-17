import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fn, waitFor } from "storybook/test";
import AiWorkspaceDemo from "../../support/ai/workspace/AiWorkspaceDemo.svelte";
import { aiWorkspaceFixture } from "../../support/ai/workspace/fixture.ts";
import { cleanupCatalog } from "../../support/lifecycle.ts";
import { AiPlugin } from "../../../src/components/ai/plugin/ai-plugin.ts";
import { prepareAiLeave } from "../../../src/lib/ai/plugin/services.ts";
const meta = {
  title: "Desktop/AI/Resource order",
  component: AiWorkspaceDemo,
  beforeEach: () => cleanupCatalog,
  tags: ["visual-pending", "!autodocs"],
} satisfies Meta<typeof AiWorkspaceDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
function ordered(mode: "close" | "reload"): Story {
  return {
    args: { kind: "ai-chat", layout: "middle-top-tabs" },
    play: async ({ canvasElement }) => {
      await waitFor(() =>
        expect(
          canvasElement.querySelector('[data-status="ready"]'),
        ).not.toBeNull(),
      );
      const fixture = aiWorkspaceFixture(canvasElement);
      await fixture.ready;
      const plugin = fixture.app.plugins.plugins.get("ai");
      expect(plugin).toBeInstanceOf(AiPlugin);
      const host = (plugin as AiPlugin).application;
      const close = fn(host.services.close);
      host.services.close = close;
      let release!: () => void;
      let entered = false;
      host.operations.ownView(() => {
        entered = true;
        return new Promise<void>((resolve) => {
          release = resolve;
        });
      });
      prepareAiLeave(fixture.app, mode);
      const closing = fixture.app.plugins.disablePlugin("ai");
      try {
        await waitFor(() => expect(entered).toBe(true));
        expect(close).not.toHaveBeenCalled();
        release();
        await closing;
        expect(close).toHaveBeenCalledWith(mode);
      } finally {
        release?.();
        await closing;
      }
    },
  };
}
export const DrainBeforeClose = ordered("close");
export const DrainBeforeReload = ordered("reload");
