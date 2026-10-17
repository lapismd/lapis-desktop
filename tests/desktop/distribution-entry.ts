import {
  Plugin,
  type App,
  type AppPluginDistributionOptions,
  type PluginRegistrySource,
  type TrustedSigningKey,
  getNativeDesktopBridge,
  setNativeDesktopBridge,
} from "@lapis-notes/api";
import { tick } from "svelte";
declare const __LAPIS_DISTRIBUTION_FIXTURE__: {
  trustedKeys: TrustedSigningKey[];
  source: PluginRegistrySource;
  responses: Record<string, { body: string; encoding: string }>;
};
const fixture = __LAPIS_DISTRIBUTION_FIXTURE__;

/** The public constructor is the only injection boundary for test trust. */
export const distributionOptions: AppPluginDistributionOptions = {
  trustedKeys:
    fixture.trustedKeys as AppPluginDistributionOptions["trustedKeys"],
  registries: [
    fixture.source as NonNullable<
      AppPluginDistributionOptions["registries"]
    >[number],
  ],
  fetch: async (url, init) => {
    if (init?.signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const response = (
      fixture.responses as Record<string, { body: string; encoding: string }>
    )[url];
    if (!response)
      return new Response("No native installation fixture", { status: 404 });
    const bytes =
      response.encoding === "base64"
        ? Uint8Array.from(atob(response.body), (character) =>
            character.charCodeAt(0),
          )
        : new TextEncoder().encode(response.body);
    return new Response(bytes);
  },
};

export function installDistributionAcceptance(application: () => App): void {
  async function result(action: () => Promise<unknown>) {
    try {
      return { ok: true, value: await action() };
    } catch (failure) {
      const error = failure as Error & { code?: string; details?: unknown };
      return {
        ok: false,
        code: error.code ?? null,
        message: error.message,
        details: error.details ?? null,
      };
    }
  }
  Object.assign(globalThis, {
    __lapisDistributionAcceptance: {
      service(available: boolean) {
        const bridge = getNativeDesktopBridge();
        if (!bridge) throw new Error("No native bridge");
        setNativeDesktopBridge({
          ...bridge,
          capabilities: {
            ...bridge.capabilities,
            notifications: {
              id: "notifications",
              status: available ? "available" : "unavailable",
            },
          },
        });
      },
      refresh: () =>
        result(async () => {
          const catalog =
            await application().pluginDistribution.refreshCatalog();
          return catalog.plugins.map((entry) => entry.id);
        }),
      install: (id: string, version?: string, enable = true) =>
        result(() =>
          application().pluginDistribution.install(id, { version, enable }),
        ),
      update: (id: string, version?: string) =>
        result(() => application().pluginDistribution.update(id, version)),
      uninstall: (id: string, removeData = false) =>
        result(async () => {
          await application().pluginDistribution.uninstall(id, { removeData });
          return null;
        }),
      bundle: (bundle: string) =>
        result(() =>
          application().pluginDistribution.installBundle(
            Uint8Array.from(atob(bundle), (character) =>
              character.charCodeAt(0),
            ),
          ),
        ),
      async inspect(id: string) {
        const app = application();
        const plugin = app.plugins.plugins.get(id);
        return {
          record: await app.pluginDistribution.getInstalled(id),
          registered: Boolean(plugin),
          command: Boolean(app.commands.getCommand(`${id}:version`)),
          enabled: app.plugins.isPluginEnabled(id),
          sharedApi: plugin instanceof Plugin,
          sharedSvelte:
            (plugin as (Plugin & { sharedTick?: unknown }) | undefined)
              ?.sharedTick === tick,
          diagnostics: app.plugins.getCommunityPluginDiagnostics(id),
          problems: app.workspace.diagnostics
            .snapshot()
            .entries.map((entry) => entry.diagnostic.message),
          ticks: Reflect.get(globalThis, "__lapisInstallTicks") ?? 0,
        };
      },
    },
  });
}
