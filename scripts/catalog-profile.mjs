import { readdirSync } from "node:fs";
import { join } from "node:path";

export const displayVariants = [
  { viewport: "desktop", theme: "light" },
  { viewport: "narrow", theme: "light" },
  { viewport: "desktop", theme: "dark" },
  { viewport: "narrow", theme: "dark" },
];

// Real shell, reading, responsive repository/backup and mobile-agent scenes.
// Shared presentation changes still select full qualification in the CI plan.
export const displayReviewFiles = [
  "catalog/plugins/Launcher.stories.ts",
  "catalog/plugins/Workspace.stories.ts",
  "catalog/plugins/desktop/Shell.stories.ts",
  "catalog/plugins/repository/HistoryLayout.stories.ts",
  "catalog/plugins/repository/BlameLayoutReview.stories.ts",
  "catalog/plugins/repository/AutomaticBackup.stories.ts",
  "catalog/plugins/background/Work.stories.ts",
  "catalog/plugins/ai/shell/Mobile.stories.ts",
];

export function catalogProfile(value = "full") {
  if (!["ordinary", "full"].includes(value))
    throw Error("Catalog profile must be ordinary or full");
  return value;
}

export function storyFiles(root = "catalog") {
  return readdirSync(root, { recursive: true })
    .filter((file) => file.endsWith(".stories.ts"))
    .map((file) => join(root, file).replaceAll("\\", "/"))
    .sort();
}

export function catalogFiles(profile, viewport, theme, files = storyFiles()) {
  catalogProfile(profile);
  if (
    !displayVariants.some((v) => v.viewport === viewport && v.theme === theme)
  )
    throw Error("Unknown catalog display variant");
  if (profile === "full" || (viewport === "desktop" && theme === "light"))
    return files;
  for (const file of displayReviewFiles)
    if (!files.includes(file))
      throw Error(`Stale catalog display mapping: ${file}`);
  return [...displayReviewFiles].sort();
}

export function catalogExclusions(environment = process.env) {
  const files = storyFiles();
  const selected = new Set(
    catalogFiles(
      catalogProfile(environment.LAPIS_DESKTOP_CATALOG_PROFILE),
      environment.LAPIS_CATALOG_VIEWPORT ?? "desktop",
      environment.LAPIS_CATALOG_THEME ?? "light",
      files,
    ),
  );
  return files.filter((file) => !selected.has(file));
}

export function catalogOptions(args, environment = process.env) {
  const profiles = args.filter((arg) => arg.startsWith("--profile="));
  if (profiles.length > 1) throw Error("Select only one catalog profile");
  return {
    profile: catalogProfile(
      profiles[0]?.slice("--profile=".length) ??
        environment.LAPIS_DESKTOP_CATALOG_PROFILE,
    ),
    args: args.filter((arg) => !profiles.includes(arg)),
  };
}
