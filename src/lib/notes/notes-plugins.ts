import type { PluginProfile } from "@lapis-notes/api";
import { FileExplorerPlugin } from "@lapis-notes/file-explorer";
import { MarkdownPlugin } from "@lapis-notes/markdown";
import markdownStyles from "@lapis-notes/markdown/styles.css?inline";
import { SourceEditorPlugin } from "@lapis-notes/source-editor";
import sourceEditorStyles from "@lapis-notes/source-editor/styles.css?inline";
import { SearchPlugin } from "@lapis-notes/search";
import searchStyles from "@lapis-notes/search/styles.css?inline";

export const desktopNotesPlugins = [
  {
    plugin: SourceEditorPlugin,
    required: false,
    enabledByDefault: true,
    styles: sourceEditorStyles,
  },
  {
    plugin: MarkdownPlugin,
    required: false,
    enabledByDefault: true,
    styles: markdownStyles,
  },
  { plugin: FileExplorerPlugin, required: false, enabledByDefault: true },
  {
    plugin: SearchPlugin,
    required: false,
    enabledByDefault: true,
    styles: searchStyles,
  },
] as const satisfies PluginProfile;
