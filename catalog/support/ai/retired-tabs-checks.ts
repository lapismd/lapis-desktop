import { expect, waitFor } from "storybook/test";
import type { createSettingsFixture } from "./settings-fixture.ts";
import { registerAiViews } from "../../../src/components/ai/plugin/register-views.ts";
import { AiApplication } from "../../../src/lib/ai/plugin/application.ts";
import { bindAi } from "../../../src/lib/ai/plugin/services.ts";
import { FakeAgentRuntime } from "../../../tests/ai/support/fake-runtime.ts";
export async function checkRetiredTabs(
  f: ReturnType<typeof createSettingsFixture>,
) {
  await f.ready;
  const unbind = bindAi(f.app, () => ({
    runtime: new FakeAgentRuntime({ id: "acp" }),
    models: { listModels: async () => [] },
    unavailableReason: () => null,
    close: async () => {},
  }));
  const host = new AiApplication(f.app, f.plugin.settings);
  try {
    registerAiViews(f.plugin, host);
    const first = f.app.workspace.getLeaf("tab");
    await first.setViewState({
      type: "ai-native-conversation-history",
      state: { nativeIdentity: "opaque" },
    });
    await waitFor(() =>
      expect(first.view.getViewType()).toBe("ai-conversation-history"),
    );
    const second = f.app.workspace.getLeaf("tab");
    await second.setViewState({
      type: "ai",
      state: {
        conversationRoute: {
          version: 1,
          backend: "jj",
          conversation: { id: "must-never-be-a-file-UUID" },
        },
      },
    });
    await waitFor(() =>
      expect(second.view.getViewType()).toBe("ai-conversation-history"),
    );
    await waitFor(() =>
      expect(
        f.controller.notifications.transient.filter(
          (r) =>
            r.source === "ai" &&
            r.message.includes("preserved in the checkpoint"),
        ),
      ).toHaveLength(1),
    );
    expect(await f.app.vault.adapter.exists(".lapis/agents/sessions")).toBe(
      false,
    );
  } finally {
    await host.close();
    unbind();
  }
}
