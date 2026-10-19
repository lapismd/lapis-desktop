import type {
  ForgeInventory,
  ForgeService,
} from "../../repository/forge-accounts.ts";
import type { NativeCall } from "../vault-client.ts";
import { nativeError } from "../native-error.ts";
export function nativeForges(call: NativeCall): ForgeService {
  async function request(command: unknown): Promise<ForgeInventory> {
    try {
      const result = await call<ForgeInventory>("desktop_forge_accounts", {
        request: { command },
      });
      if (
        !result ||
        !Array.isArray(result.accounts) ||
        result.accounts.length > 64 ||
        typeof result.oauth_available !== "boolean" ||
        typeof result.keychain_supported !== "boolean"
      )
        throw new Error("Invalid forge account inventory");
      const auth = result.authorization;
      if (
        auth &&
        (typeof auth.session !== "string" ||
          typeof auth.user_code !== "string" ||
          auth.verification_uri !== "https://github.com/login/device" ||
          !Number.isSafeInteger(auth.interval) ||
          auth.interval < 5 ||
          auth.interval > 60)
      )
        throw new Error("Invalid GitHub authorization response");
      return result;
    } catch (error) {
      throw nativeError(error);
    }
  }
  return {
    inventory: () => request(null),
    command: request,
    async openAuthorization(url) {
      if (url !== "https://github.com/login/device")
        throw new Error("Invalid GitHub authorization URL");
      await call("desktop_external_open", { url });
    },
  };
}
