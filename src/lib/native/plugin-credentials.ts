import { invoke } from "@tauri-apps/api/core";
import {
  createNativePluginSecretsHost,
  type AppStateProperties,
  type PluginCredentialReply,
} from "@lapis-notes/api";
import { nativeError } from "./native-error.ts";
import type { NativeCall, VaultDescriptor } from "./vault-client.ts";

export type DesktopPluginHost = Pick<
  AppStateProperties,
  "pluginAssetServer" | "pluginSecretsHost"
>;

export async function preparePluginCredentials(
  { sessionId }: VaultDescriptor,
  call: NativeCall = invoke,
) {
  const grants = await call<unknown>("vault_credential_grants", {
    sessionId,
  }).catch(() => undefined);
  if (!Array.isArray(grants) || !grants.every((id) => typeof id === "string"))
    return undefined;
  return createNativePluginSecretsHost(grants, async (command) => {
    try {
      return await call<PluginCredentialReply>("vault_plugin_credentials", {
        sessionId,
        command,
      });
    } catch (error) {
      throw nativeError(error);
    }
  });
}
