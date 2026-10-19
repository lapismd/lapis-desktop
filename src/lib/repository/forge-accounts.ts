/** Public account identities only. Credentials stay in native custody. */
export type ForgeAccount = {
  id: string;
  api_url: string;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  method: "oauth" | "pat" | "enterprise";
  available: boolean;
};
export type ForgeAuthorization = {
  session: string;
  user_code: string;
  verification_uri: string;
  interval: number;
  expires_at: number;
  state: string;
};
export type ForgeInventory = {
  accounts: ForgeAccount[];
  oauth_available: boolean;
  keychain_supported: boolean;
  authorization: ForgeAuthorization | null;
};
export type ForgeCommand =
  | { kind: "begin_oauth" }
  | { kind: "poll_oauth" | "cancel_oauth"; session: string }
  | { kind: "forget"; account: string }
  | { kind: "add_token"; api_url: string; token: string };
export interface ForgeService {
  inventory(): Promise<ForgeInventory>;
  command(command: ForgeCommand): Promise<ForgeInventory>;
  openAuthorization(url: string): Promise<void>;
}
export type ForgeState = {
  inventory?: ForgeInventory;
  busy: boolean;
  flow: "oauth" | "pat" | "enterprise" | "";
};
