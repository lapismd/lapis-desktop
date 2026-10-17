// SPDX-License-Identifier: Apache-2.0
// Retained six-placement Lapis workspace fixture; see src/lib/ai/NOTICE.md.
import {
  AI_VIEW,
  AI_HISTORY_VIEW,
  AI_CATALOG_VIEW,
} from "../../../../src/lib/ai/plugin/view-types.ts";
export type AiPanelKind = "ai-chat" | "ai-history" | "ai-catalog";
export type AiPanelLayout =
  | "middle-top-tabs"
  | "stacked-tabs"
  | "left-sidebar"
  | "right-sidebar"
  | "bottom-panel"
  | "sidebar-group";
export const AI_PANEL_TYPES = {
  "ai-chat": AI_VIEW,
  "ai-history": AI_HISTORY_VIEW,
  "ai-catalog": AI_CATALOG_VIEW,
};
export const AI_PANEL_META = {
  "ai-chat": {
    title: "AI chat",
    icon: "sparkles",
    group: "AI",
    requiresFile: false,
  },
  "ai-history": {
    title: "AI conversations",
    icon: "history",
    group: "AI",
    requiresFile: true,
  },
  "ai-catalog": {
    title: "Catalog",
    icon: "library",
    group: "AI",
    requiresFile: true,
  },
};
function leaf(
  id: string,
  title: string,
  icon: string,
  type: string,
  state: Record<string, unknown> = {},
) {
  return { id, type: "leaf", state: { type, state, icon, title } };
}

type DemoLeaf = ReturnType<typeof leaf>;

function sidebarGroup(
  id: string,
  name: string,
  icon: string,
  children: DemoLeaf[],
) {
  return {
    id,
    type: "sidebar-group",
    name,
    icon,
    children,
    collapsed: Object.fromEntries(children.map((child) => [child.id, false])),
    panelSizes: Object.fromEntries(children.map((child) => [child.id, 100])),
  };
}

type DemoTabItem = DemoLeaf | ReturnType<typeof sidebarGroup>;

function tabs(
  id: string,
  children: DemoTabItem[],
  options: { stacked?: boolean; currentTab?: number } = {},
) {
  return {
    id,
    type: "tabs",
    stacked: options.stacked ?? false,
    currentTab: options.currentTab ?? 0,
    children,
  };
}

function split(
  id: string,
  direction: "horizontal" | "vertical",
  children: ReturnType<typeof tabs>[],
  options: { width?: string; sizes?: number[] } = {},
) {
  return {
    id,
    type: "split",
    direction,
    sizes:
      options.sizes ?? children.map(() => 100 / Math.max(children.length, 1)),
    children,
    ...(options.width ? { width: options.width } : {}),
  };
}

function emptyDock(id: string) {
  return split(id, "vertical", [], { width: "0px" });
}

function emptyBottom() {
  return { ...tabs("bottom-panel", []), height: "0px" };
}

function emptyWorkspaceTabs(id = "main-empty-tabs") {
  return tabs(id, [leaf("main-empty", "Workspace", "file", "empty")]);
}

function markdownTabs(id = "main-document-tabs") {
  return tabs(id, [
    leaf("welcome", "Welcome", "file-text", "markdown", {
      file: "Notes/Welcome.md",
      mode: "live-preview",
    }),
  ]);
}

function mainContext(requiresFile: boolean) {
  return split("main", "horizontal", [
    requiresFile ? markdownTabs() : emptyWorkspaceTabs(),
  ]);
}

export function aiPanelMarker(
  kind: AiPanelKind,
  layout: AiPanelLayout,
): string {
  if (layout === "stacked-tabs") return "main-stacked-tabs";
  if (layout === "bottom-panel") return `${kind}-bottom-group`;
  if (layout === "sidebar-group") return `${kind}-sidebar-group`;
  return {
    "middle-top-tabs": "panel-middle",
    "left-sidebar": "panel-left",
    "right-sidebar": "panel-right",
  }[layout];
}

export function aiPanelLayout(
  kind: AiPanelKind,
  layout: AiPanelLayout,
): Record<string, unknown> {
  const panelType = AI_PANEL_TYPES[kind];
  const meta = AI_PANEL_META[kind];
  const panel = (id: string) => leaf(id, meta.title, meta.icon, panelType);
  const contextTabs = () =>
    meta.requiresFile ? markdownTabs() : emptyWorkspaceTabs();

  if (layout === "middle-top-tabs") {
    const panelTabs = tabs("main-panel-tabs", [panel("panel-middle")]);
    return {
      main: split(
        "main",
        "horizontal",
        meta.requiresFile ? [contextTabs(), panelTabs] : [panelTabs],
        { sizes: meta.requiresFile ? [35, 65] : undefined },
      ),
      left: emptyDock("left"),
      right: emptyDock("right"),
      bottom: emptyBottom(),
      floating: [],
      active: "panel-middle",
    };
  }

  if (layout === "stacked-tabs") {
    const panelTabs = tabs(
      "main-stacked-tabs",
      [
        leaf("stacked-workspace", "Workspace", "layout-template", "empty"),
        panel("panel-stacked"),
        leaf("stacked-reference", "Reference", "book-open", "empty"),
      ],
      { stacked: true, currentTab: 1 },
    );
    return {
      main: split(
        "main",
        "horizontal",
        meta.requiresFile ? [contextTabs(), panelTabs] : [panelTabs],
        { sizes: meta.requiresFile ? [35, 65] : undefined },
      ),
      left: emptyDock("left"),
      right: emptyDock("right"),
      bottom: emptyBottom(),
      floating: [],
      active: "panel-stacked",
    };
  }

  if (layout === "left-sidebar") {
    return {
      main: mainContext(meta.requiresFile),
      left: split(
        "left",
        "vertical",
        [tabs("left-panel-tabs", [panel("panel-left")])],
        { width: "22rem" },
      ),
      right: emptyDock("right"),
      bottom: emptyBottom(),
      floating: [],
      active: "panel-left",
    };
  }

  if (layout === "right-sidebar") {
    return {
      main: mainContext(meta.requiresFile),
      left: emptyDock("left"),
      right: split(
        "right",
        "vertical",
        [tabs("right-panel-tabs", [panel("panel-right")])],
        { width: "22rem" },
      ),
      bottom: emptyBottom(),
      floating: [],
      active: "panel-right",
    };
  }

  if (layout === "bottom-panel") {
    return {
      main: mainContext(meta.requiresFile),
      left: emptyDock("left"),
      right: emptyDock("right"),
      bottom: {
        ...tabs("bottom-panel", [
          sidebarGroup(`${kind}-bottom-group`, meta.group, meta.icon, [
            panel("panel-bottom"),
          ]),
        ]),
        height: "22rem",
      },
      floating: [],
      active: "panel-bottom",
    };
  }

  return {
    main: mainContext(meta.requiresFile),
    left: emptyDock("left"),
    right: split(
      "right",
      "vertical",
      [
        tabs("right-panel-tabs", [
          sidebarGroup(`${kind}-sidebar-group`, meta.group, meta.icon, [
            panel("panel-grouped"),
          ]),
        ]),
      ],
      { width: "24rem" },
    ),
    bottom: emptyBottom(),
    floating: [],
    active: "panel-grouped",
  };
}
