// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { Vault, MemoryVaultAdapter } from "@lapis-notes/api/vault";
import { aiEnabledByDefault } from "../../../src/lib/ai/plugin/preferences.ts";
const owner = (files: Record<string, string>) => ({
  vault: new Vault(new MemoryVaultAdapter(files)),
});
describe("bundled AI activation preferences", () => {
  it("enables new installations without changing saved files", async () => {
    const app = owner({});
    expect(await aiEnabledByDefault(app)).toBe(true);
    expect(
      await app.vault.adapter.exists(".lapis/installed-plugins.json"),
    ).toBe(false);
  });
  it("retains both former disabling sources even if another source says enabled", async () => {
    expect(
      await aiEnabledByDefault(
        owner({
          ".lapis/app-shell-plugins.json": '{"ai":false}',
          ".lapis/installed-plugins.json":
            '{"plugins":{"ai":{"enabled":true}}}',
        }),
      ),
    ).toBe(false);
    expect(
      await aiEnabledByDefault(
        owner({
          ".lapis/app-shell-plugins.json": '{"ai":true}',
          ".lapis/installed-plugins.json":
            '{"plugins":{"ai":{"enabled":false}}}',
        }),
      ),
    ).toBe(false);
  });
  it("does not interpret unrelated disabling as an AI preference", async () => {
    expect(
      await aiEnabledByDefault(
        owner({ ".lapis/app-shell-plugins.json": '{"terminal":false}' }),
      ),
    ).toBe(true);
  });
  it("fails visibly on malformed saved preferences without rewriting them", async () => {
    const app = owner({ ".lapis/installed-plugins.json": "[]" });
    await expect(aiEnabledByDefault(app)).rejects.toThrow(
      "Invalid saved AI preferences",
    );
    expect(await app.vault.adapter.read(".lapis/installed-plugins.json")).toBe(
      "[]",
    );
  });
});
