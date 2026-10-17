// SPDX-License-Identifier: Apache-2.0
// Retained Lapis chat binding labels; see ../../NOTICE.md.
import type { AgentBindingCreatedRecord } from "../../conversations/types.ts";
export function bindingLabels(
  bindings: AgentBindingCreatedRecord[],
): Map<string, string> {
  return new Map(
    bindings.map((binding) => {
      const label =
        binding.runtime === "codex-native"
          ? "Codex Native"
          : binding.runtime === "opencode-native"
            ? "OpenCode Native"
            : binding.agent === "cursor"
              ? "Cursor ACP"
              : binding.agent === "opencode"
                ? "OpenCode ACP"
                : "Codex ACP";
      return [
        binding.id,
        binding.model?.model ? `${label} · ${binding.model.model}` : label,
      ];
    }),
  );
}
