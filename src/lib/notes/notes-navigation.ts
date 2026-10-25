import type { WorkspaceNavigation } from "@lapismd/design-core/workspace/app-shell";

export function notesNavigation(
  label: string,
  onManage: () => void | Promise<void>,
): WorkspaceNavigation {
  return {
    currentLabel: label,
    menuLabel: "Vault",
    items: [{ id: "current", label, disabled: true }],
    manageLabel: "Back to vaults",
    onSelect: () => {},
    onManage,
  };
}
