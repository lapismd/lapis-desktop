import { invoke } from "@tauri-apps/api/core";
import type { SkillManagementHost } from "@lapis-notes/api";
import type { NativeCall, VaultDescriptor } from "./vault-client.ts";

export function createSkillManagement(
  selected: VaultDescriptor,
  call: NativeCall = invoke,
): SkillManagementHost {
  return {
    manage: (action, skill) =>
      call("vault_skills", {
        sessionId: selected.sessionId,
        action,
        skill: skill ?? null,
      }),
  };
}
