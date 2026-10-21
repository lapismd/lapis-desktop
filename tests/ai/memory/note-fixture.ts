import { MemoryVaultAdapter, Vault } from "@lapis-notes/api/vault";
/** Test-only conditional adapter; production uses the native host's CAS. */
export class ConditionalMemoryAdapter extends MemoryVaultAdapter {
  getCapabilities() {
    return { ...super.getCapabilities(), conditionalTextWrite: true };
  }
  async writeTextIfUnchanged(
    path: string,
    data: string,
    expected: string | null,
  ) {
    const current = (await this.exists(path)) ? await this.read(path) : null;
    if (current !== expected) throw new Error("File changed externally");
    await this.write(path, data);
  }
}
export function noteVault(seed?: Record<string, string>) {
  return new Vault(new ConditionalMemoryAdapter(seed));
}
