import type { App, Plugin } from "@lapis-notes/api";
import { AiApplication } from "../../../../src/lib/ai/plugin/application.ts";
import { bindAi } from "../../../../src/lib/ai/plugin/services.ts";
import { AI_NATIVE_HISTORY_VIEW } from "../../../../src/lib/ai/plugin/view-types.ts";
import { registerAiViews } from "../../../../src/components/ai/plugin/register-views.ts";
import type { AiSettingsStore } from "../../../../src/lib/ai/settings/settings-store.ts";
import type { NativeConversationSettingsManagement } from "../../../../src/lib/ai/settings/native-conversation-settings.ts";
import { FakeAgentRuntime } from "../../../../tests/ai/support/fake-runtime.ts";
import { nativeSetupPort, type NativeSetupScenario } from "./setup-port.ts";

export function nativeSetupFixture(
  app: App,
  settings: AiSettingsStore,
  scenario: NativeSetupScenario,
) {
  const native = nativeSetupPort(scenario),
    runtime = new FakeAgentRuntime({ id: "acp" });
  const unbind = bindAi(app, () => ({
    runtime,
    models: { listModels: async () => [] },
    unavailableReason: () => null,
    conversationBackend:
      scenario === "native-unavailable" ? undefined : native.port,
    close: async () => {
      for (const session of runtime.sessions) await session.close();
    },
  }));
  const host = new AiApplication(app, settings);
  const management: NativeConversationSettingsManagement = {
    setup: host.nativeConversationSetup,
    openHistory: () => host.revealPanel(AI_NATIVE_HISTORY_VIEW, "right"),
    openConversation: (conversation) =>
      host.openAiConversationRoute({ version: 1, backend: "jj", conversation }),
  };
  return {
    management,
    registerViews: (plugin: Plugin) => registerAiViews(plugin, host),
    close: async () => {
      native.finish();
      await host.close();
      unbind();
    },
  };
}
