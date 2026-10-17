// SPDX-License-Identifier: Apache-2.0
// Retained lapis-plugins ee20d366 shell fixtures; see src/lib/ai/NOTICE.md.
import {
  AI_VIEW as AiViewType,
  AI_HISTORY_VIEW as AiHistoryViewType,
  AI_CATALOG_VIEW as AiCatalogViewType,
  AI_JSONL_VIEW as AiJsonlViewType,
} from "../../../../src/lib/ai/plugin/view-types.ts";
import { LOCAL_CONVERSATION_ID, type ShellScenario } from "./types.ts";
function leaf(
  id: string,
  title: string,
  icon: string,
  type: string,
  state: Record<string, unknown> = {},
) {
  return {
    id,
    type: "leaf",
    state: { type, state, icon, title },
  };
}

function tabs(id: string, children: ReturnType<typeof leaf>[]) {
  return {
    id,
    type: "tabs",
    stacked: false,
    currentTab: 0,
    children,
  };
}

function split(
  id: string,
  direction: "horizontal" | "vertical",
  children: unknown[],
  extra: Record<string, unknown> = {},
) {
  return {
    id,
    type: "split",
    direction,
    sizes: children.length > 0 ? [100] : [],
    children,
    ...extra,
  };
}

export function shellLayout(
  initialLocation?: {
    scopeDir: string;
    conversationId: string;
  },
  scenario: ShellScenario = "default",
) {
  const jsonlPath = `Notes/.lapis/agents/sessions/${LOCAL_CONVERSATION_ID}/transcript.jsonl`;
  const mainLeaf =
    scenario === "jsonl-preview"
      ? leaf(
          "ai-jsonl-preview",
          "transcript.jsonl",
          "messages-square",
          AiJsonlViewType,
          { file: jsonlPath },
        )
      : leaf("ai-chat", "AI", "sparkles", AiViewType, initialLocation);
  if (scenario === "local-conversations") {
    return {
      main: split("main", "horizontal", [tabs("main-tabs", [])]),
      left: split(
        "left",
        "vertical",
        [
          tabs("left-panel-tabs", [
            leaf("file-explorer", "Files", "folder-closed", "file-explorer"),
          ]),
        ],
        { width: "17rem" },
      ),
      right: split(
        "right",
        "vertical",
        [tabs("right-panel-tabs", [mainLeaf])],
        { width: "26rem" },
      ),
      bottom: { ...tabs("bottom-panel", []), height: "0px" },
      floating: [],
      active: mainLeaf.id,
    };
  }
  if (scenario === "registry-overview") {
    return {
      main: split("main", "horizontal", [tabs("main-tabs", [mainLeaf])]),
      left: split(
        "left",
        "vertical",
        [
          tabs("left-panel-tabs", [
            leaf("ai-history", "History", "history", AiHistoryViewType),
          ]),
        ],
        { width: "18rem" },
      ),
      right: split(
        "right",
        "vertical",
        [
          tabs("right-panel-tabs", [
            leaf("ai-catalog", "Catalog", "library", AiCatalogViewType),
          ]),
        ],
        { width: "18rem" },
      ),
      bottom: { ...tabs("bottom-panel", []), height: "0px" },
      floating: [],
      active: mainLeaf.id,
    };
  }
  return {
    main: split("main", "horizontal", [tabs("main-tabs", [mainLeaf])]),
    left: split(
      "left",
      "vertical",
      [
        tabs("left-panel-tabs", [
          leaf("file-explorer", "Files", "folder-closed", "file-explorer"),
        ]),
      ],
      { width: scenario === "registry-chat" ? "0px" : "17rem" },
    ),
    right: split(
      "right",
      "vertical",
      [
        tabs("right-panel-tabs", [
          leaf("search", "Search", "search", "search", { query: "TODO" }),
        ]),
      ],
      { width: "0px" },
    ),
    bottom: { ...tabs("bottom-panel", []), height: "0px" },
    floating: [],
    active: mainLeaf.id,
  };
}
