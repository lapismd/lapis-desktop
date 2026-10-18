import { relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

/** Manually mounted Apps/controllers cannot safely retain old class shapes.
 * @returns {import("vite").Plugin}
 */
export function ownedRuntimeReload() {
  return {
    name: "lapis-owned-runtime-reload",
    apply: "serve",
    handleHotUpdate({ file, server }) {
      const path = relative(root, file).split(sep).join("/");
      const runtime =
        path.startsWith("src/") &&
        /\.[cm]?[jt]sx?$/.test(path) &&
        !/\.d\.[cm]?ts$/.test(path);
      const fixture =
        path.startsWith("catalog/support/") &&
        /\.(?:[cm]?[jt]sx?|svelte)$/.test(path);
      if (!runtime && !fixture) return;
      server.ws.send({ type: "full-reload" });
      return [];
    },
  };
}
