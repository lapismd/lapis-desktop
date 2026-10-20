import type { NativeConversationReference } from "../../../../src/lib/ai/conversations/conversation-route.ts";
import { AI_NATIVE_HISTORY_VIEW } from "../../../../src/lib/ai/plugin/view-types.ts";

export function routeReviewLayout(
  conversation: NativeConversationReference,
  withAcp: boolean,
  nativeCatalog = false,
) {
  const panel = (
    id: string,
    state: Record<string, unknown>,
    title: string,
    type = "ai",
  ) => ({
    id,
    type: "tabs",
    currentTab: 0,
    children: [
      {
        id: `${id}-leaf`,
        type: "leaf",
        state: { type, state, title, icon: "sparkles" },
      },
    ],
  });
  const native = panel(
    "native-tab",
    nativeCatalog
      ? {}
      : {
          conversationRoute: { version: 1, backend: "jj", conversation },
        },
    "Native JJ history",
    nativeCatalog ? AI_NATIVE_HISTORY_VIEW : "ai",
  );
  const dock = (id: string) => ({
    id,
    type: "split",
    direction: "vertical",
    sizes: [],
    width: "0px",
    children: [],
  });
  return {
    main: {
      id: "main",
      type: "split",
      direction: "horizontal",
      sizes: withAcp ? [50, 50] : [100],
      children: withAcp
        ? [panel("normal-acp", {}, "ACP chat"), native]
        : [native],
    },
    left: dock("left"),
    right: dock("right"),
    bottom: {
      id: "bottom",
      type: "tabs",
      currentTab: 0,
      children: [],
      height: "0px",
    },
    floating: [],
    active: "native-tab-leaf",
  };
}
