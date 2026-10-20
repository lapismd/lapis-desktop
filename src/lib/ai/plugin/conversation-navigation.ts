// SPDX-License-Identifier: Apache-2.0
import type { App, WorkspaceLeaf } from "@lapis-notes/api";
import {
  conversationRoute,
  conversationRouteFromState,
  sameConversationRoute,
  stateWithConversationRoute,
  type ConversationRoute,
} from "../conversations/conversation-route.ts";
import { revealConversationScope } from "../conversations/reveal-scope.ts";
import { AI_VIEW } from "./view-types.ts";

/** Route references choose a reader, never a storage selection or an execution grant. */
export async function openConversationRoute(
  app: App,
  assertActive: () => void,
  input: ConversationRoute | null,
): Promise<void> {
  assertActive();
  const route = input ? conversationRoute(input) : null;
  let match: WorkspaceLeaf | undefined, unbound: WorkspaceLeaf | undefined;
  app.workspace.iterateRootLeaves((leaf) => {
    if (leaf.view.getViewType() !== AI_VIEW) return;
    const current = conversationRouteFromState(leaf.view.getState());
    if (!current) unbound ??= leaf;
    if (route && sameConversationRoute(current, route)) match ??= leaf;
  });
  const leaves = app.workspace.getLeavesOfType(AI_VIEW);
  const existing = route ? match : leaves[0];
  const target =
    existing ??
    (route
      ? (unbound ?? app.workspace.getLeaf("tab"))
      : leaves.length
        ? app.workspace.getLeaf("tab")
        : app.workspace.ensureSideLeaf(AI_VIEW, "right"));
  if (!existing)
    await target.setViewState({
      type: AI_VIEW,
      state: stateWithConversationRoute({}, route),
    });
  assertActive();
  app.workspace.activateLeaf(target, {
    focusRootHost: false,
    source: "api",
    operation: "open-ai-chat",
  });
  await app.workspace.revealLeaf(target);
  if (route?.backend === "vault-files")
    revealConversationScope(app, route.location.scopeDir);
}
