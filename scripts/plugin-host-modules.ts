import { pluginHostModuleRegistry } from "@lapis-notes/api/plugin-host-modules";
import type { Plugin } from "vite";

interface HostModule {
  entry: string;
  moduleId: string;
  packageName: string;
  platforms: readonly string[];
  public: boolean;
  source?: string;
  defaultExport?: boolean;
}

const registry: Record<string, HostModule> = pluginHostModuleRegistry;
const editorModules = new Set([
  "@codemirror/autocomplete",
  "@codemirror/commands",
  "@codemirror/language",
  "@codemirror/lint",
  "@codemirror/search",
  "@codemirror/state",
  "@codemirror/view",
  "@lezer/common",
  "@lezer/highlight",
  "@lezer/lr",
]);
const modules = Object.entries(registry).filter(
  ([specifier, entry]) =>
    entry.public &&
    entry.platforms.includes("web") &&
    (entry.packageName === "@lapis-notes/api" ||
      specifier === "@lapis-notes/markdown/embed" ||
      editorModules.has(specifier) ||
      entry.source === "renderer-abi"),
);

const routes = modules.map(([specifier, entry]) => ({
  specifier,
  entry,
  name: `plugin-host-${entry.moduleId}`,
  id: `\0lapis-desktop-plugin-host-${entry.moduleId}`,
  url: `/plugin-host-${entry.moduleId}.js`,
}));

export const pluginHostInputs = Object.fromEntries(
  routes.map((route) => [route.name, route.id]),
);
export const pluginImportMap = {
  imports: Object.fromEntries(
    routes.map((route) => [route.specifier, route.url]),
  ),
};

export function pluginHostModules(): Plugin {
  return {
    name: "desktop-plugin-host-modules",
    resolveId(id) {
      return routes.find((route) => route.id === id || route.url === id)?.id;
    },
    load(id) {
      const route = routes.find((route) => route.id === id);
      if (!route) return;
      return (
        `export * from ${JSON.stringify(route.entry.entry)};\n` +
        (route.entry.defaultExport
          ? `export { default } from ${JSON.stringify(route.entry.entry)};\n`
          : "")
      );
    },
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        const route = routes.find(
          (route) => route.url === request.url?.split("?", 1)[0],
        );
        if (route) request.url = "/@id/__x00__" + route.id.slice(1);
        next();
      });
    },
    transformIndexHtml() {
      return [
        {
          tag: "script",
          attrs: { type: "importmap" },
          children: JSON.stringify(pluginImportMap),
          injectTo: "head-prepend",
        },
      ];
    },
  };
}
