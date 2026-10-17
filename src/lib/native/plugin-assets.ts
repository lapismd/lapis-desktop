import { appStatePath } from "@lapis-notes/api/path";
import {
  assertSupportedPluginAssetPath,
  createWebPluginAssetUrl,
  getInstalledPluginAssetFingerprintSha256,
  normalizePluginAssetRelativePath,
  PluginAssetServerError,
  type InstalledPluginRecord,
  type PluginAssetServer,
} from "@lapis-notes/api/plugin-assets";

/** URL construction only; Rust revalidates admission and every returned byte. */
export function createNativePluginAssetServer(
  adapter: { read(path: string): Promise<string> },
  admission: string,
  origin = globalThis.location.href,
): PluginAssetServer {
  return {
    async getPluginAssetUrl(request) {
      const base = new URL(origin);
      if (
        !(
          (base.protocol === "tauri:" && base.hostname === "localhost") ||
          (base.protocol === "http:" && base.host === "tauri.localhost")
        )
      )
        throw new PluginAssetServerError(
          "asset-server-unavailable",
          "Installed plugin assets require the bundled desktop origin.",
        );
      const state = JSON.parse(
        await adapter.read(appStatePath("installed-plugins.json")),
      ) as {
        plugins?: Record<string, InstalledPluginRecord>;
      };
      const record =
        state.plugins && Object.hasOwn(state.plugins, request.pluginId)
          ? state.plugins[request.pluginId]
          : undefined;
      if (!record || record.pluginId !== request.pluginId)
        throw new PluginAssetServerError(
          "asset-not-installed",
          `Plugin ${request.pluginId} is not installed.`,
        );
      if (record.installedVersion !== request.version)
        throw new PluginAssetServerError(
          "asset-version-mismatch",
          `Plugin ${request.pluginId} installation changed.`,
        );
      const path = normalizePluginAssetRelativePath(request.relativePath);
      assertSupportedPluginAssetPath(path);
      const route = createWebPluginAssetUrl({
        vaultId: admission,
        pluginId: request.pluginId,
        version: record.installedVersion,
        sha256: await getInstalledPluginAssetFingerprintSha256(record),
        path,
      });
      return new URL(route, base).href;
    },
  };
}
