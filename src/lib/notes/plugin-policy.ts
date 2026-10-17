import type { AppSafeModeState } from "@lapis-notes/api";

export function pluginLoadOptions(
  mode: Pick<
    AppSafeModeState,
    "disableCommunityPlugins" | "disableOptionalCorePlugins"
  >,
) {
  return {
    communityPlugins: mode.disableCommunityPlugins ? "disabled" : "configured",
    optionalCorePlugins: mode.disableOptionalCorePlugins
      ? "disabled"
      : "configured",
  } as const;
}

// The native AI replacement is delivered in M10; never revive the retired host.
export const unavailableDesktopPlugins = {
  ai: "platform-unsupported",
} as const;
