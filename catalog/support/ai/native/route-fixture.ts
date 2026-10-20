import { createChatApp } from "../app-fixture.ts";
import { registerCatalogCleanup } from "../../lifecycle.ts";
import { nativeReaderPort } from "./port.ts";
import { owner } from "./facts.ts";
import { AiApplication } from "../../../../src/lib/ai/plugin/application.ts";
import { AiSettingsStore } from "../../../../src/lib/ai/settings/settings-store.ts";
import { AiView } from "../../../../src/components/ai/views/ai-view.ts";
import { AiNativeHistoryView } from "../../../../src/components/ai/views/native-history-view.ts";
import {
  AI_VIEW,
  AI_NATIVE_HISTORY_VIEW,
} from "../../../../src/lib/ai/plugin/view-types.ts";
import { bindAi } from "../../../../src/lib/ai/plugin/services.ts";
import { FakeAgentRuntime } from "../../../../tests/ai/support/fake-runtime.ts";
import { agentReviewProfiles } from "../transcript/agent-profiles.ts";
import { routeReviewLayout } from "./route-layout.ts";

export type NativeRouteScenario =
  | "restored"
  | "foreign"
  | "with-acp"
  | "live"
  | "native-catalog";
export function createNativeRouteFixture(scenario: NativeRouteScenario) {
  const base = createChatApp(() => {}),
    native = nativeReaderPort("captured");
  const runtime = new FakeAgentRuntime({ id: "acp" });
  const release = bindAi(base.app, () => ({
    runtime,
    // Unconfigured native profile: real composer, no provider or launch grant.
    managedAgents:
      scenario === "live"
        ? {
            supports: async () => false,
            start: async () => {
              throw new Error(
                "Configure an admitted Codex client to send native messages",
              );
            },
            prepareStop: async () => {},
            releaseStopped: async () => {},
            close: async () => {},
          }
        : undefined,
    conversationBackend: native.port,
    models: { listModels: async () => [] },
    unavailableReason: () => null,
    close: async () => {
      for (const session of runtime.sessions) await session.close();
    },
  }));
  const settings = new AiSettingsStore(async () => {});
  let host: AiApplication | undefined,
    closing = false,
    shutdown: Promise<void> | undefined;
  const ready = (async () => {
    await base.ready;
    if (closing) return;
    await settings.update({ agentParticipants: agentReviewProfiles });
    host = new AiApplication(base.app, settings);
    base.app.workspace.registerView(AI_VIEW, (leaf) => new AiView(leaf, host!));
    base.app.workspace.registerView(
      AI_NATIVE_HISTORY_VIEW,
      (leaf) => new AiNativeHistoryView(leaf, host!),
    );
    await base.app.workspace.changeLayout(
      routeReviewLayout(
        {
          ...owner,
          target: { type: "conversation", id: owner.target.id },
          repository:
            scenario === "foreign" ? "f".repeat(32) : owner.repository,
        },
        scenario === "with-acp",
        scenario === "native-catalog",
      ),
    );
  })();
  const close = () =>
    (shutdown ??= (async () => {
      closing = true;
      native.finish();
      await ready;
      await host?.close();
      await base.close();
      release();
    })());
  const unregister = registerCatalogCleanup(close);
  return {
    app: base.app,
    ready,
    close: async () => {
      unregister();
      await close();
    },
  };
}
