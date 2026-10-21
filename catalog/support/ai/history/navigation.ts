import { Plugin, type App } from "@lapis-notes/api";
import { AiApplication } from "../../../../src/lib/ai/plugin/application.ts";
import { AiSettingsStore } from "../../../../src/lib/ai/settings/settings-store.ts";
import { registerAiViews } from "../../../../src/components/ai/plugin/register-views.ts";

/** Register the real destination views; provider execution stays unavailable. */
class NavigationReviewPlugin extends Plugin {
  host?: AiApplication;
  constructor(app: App) {
    super(app, {
      id: "ai",
      name: "AI navigation review",
      description:
        "Production AI view navigation in the disposable review App.",
      author: "Lapis",
      version: "0.1.0",
      minAppVersion: "0.1.0",
    });
  }
  override onload() {
    this.host = new AiApplication(
      this.app,
      new AiSettingsStore(async () => {}),
    );
    registerAiViews(this, this.host);
  }
  override async onunload() {
    await this.host?.close();
  }
}

export async function installHistoryNavigation(app: App) {
  app.plugins.registerStaticPlugins([NavigationReviewPlugin]);
  if (!(await app.plugins.enablePlugin("ai")))
    throw new Error("AI navigation review failed to enable");
}
