// SPDX-License-Identifier: Apache-2.0
import type { App } from "@lapis-notes/api";
import { AiView } from "../../../../src/components/ai/views/ai-view.ts";
import { AiPlugin } from "../../../../src/components/ai/plugin/ai-plugin.ts";
import { AI_VIEW } from "../../../../src/lib/ai/plugin/view-types.ts";
import ChatSessionReview from "../../../../src/components/ai/sessions/AiChatSession.svelte";
import SendingErrorChatReview from "./SendingErrorChatReview.svelte";

/** Replace only this disposable catalog App's view factory before layout loading. */
export function registerChatReview(app: App, sendingError = false) {
  class ReviewChatView extends AiView {
    protected override transcriptFrame = sendingError
      ? SendingErrorChatReview
      : ChatSessionReview;
  }
  const plugin = app.plugins.plugins.get("ai");
  if (!(plugin instanceof AiPlugin))
    throw new Error("AI review requires the owned plugin");
  app.workspace.unregisterView(AI_VIEW);
  app.workspace.registerView(
    AI_VIEW,
    (leaf) => new ReviewChatView(leaf, plugin.application),
  );
}
