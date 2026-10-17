// SPDX-License-Identifier: Apache-2.0
// Retained source regression coverage; see src/lib/ai/NOTICE.md.
import { beforeAll, describe, expect, it } from "vitest";
import { RESEARCH_SKILL_MARKDOWN } from "../../../src/lib/ai/skills/bundled/research.ts";
import { seedBundledSkills } from "../../../src/lib/ai/skills/seed.ts";

let Vault: typeof import("@lapis-notes/api/vault").Vault;
let MemoryVaultAdapter: typeof import("@lapis-notes/api/vault").MemoryVaultAdapter;

beforeAll(async () => {
  ({ Vault, MemoryVaultAdapter } = await import("@lapis-notes/api/vault"));
});

describe("seedBundledSkills", () => {
  it("writes packaged skills only when missing and overwrites packaged names on update", async () => {
    const vault = new Vault(new MemoryVaultAdapter());
    await vault.load();
    await seedBundledSkills(vault);
    const research = vault.getFileByPath(".agents/skills/research/SKILL.md");
    const lapis = vault.getFileByPath(".agents/skills/lapis-notes/SKILL.md");
    expect(research).toBeTruthy();
    expect(lapis).toBeTruthy();
    await vault.modify(research!, "user edited research");
    await seedBundledSkills(vault);
    expect(await vault.cachedRead(research!)).toBe("user edited research");
    await seedBundledSkills(vault, { overwrite: true });
    expect(await vault.cachedRead(research!)).toBe(RESEARCH_SKILL_MARKDOWN);
  });
});
