import type { AppSafeModeFailure, AppSafeModeState } from "@lapis-notes/api";

type RecoveryStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const key = (profile: string) => `lapis.safeMode.session:${profile}`;
export function normalRecovery(): AppSafeModeState {
  return {
    active: false,
    disableCommunityPlugins: false,
    disableOptionalCorePlugins: false,
    skipLayoutRestore: false,
    disableNotebookExecution: false,
    lastStartupFailure: null,
  };
}
function normalize(value: unknown): AppSafeModeState {
  const state =
    value && typeof value === "object"
      ? (value as Partial<AppSafeModeState>)
      : {};
  if (state.active !== true) return normalRecovery();
  const failure = state.lastStartupFailure;
  return {
    ...normalRecovery(),
    active: state.active === true,
    disableOptionalCorePlugins: state.disableOptionalCorePlugins === true,
    skipLayoutRestore: state.skipLayoutRestore === true,
    lastStartupFailure:
      failure &&
      typeof failure.message === "string" &&
      typeof failure.detail === "string"
        ? {
            task: typeof failure.task === "string" ? failure.task : null,
            message: failure.message,
            detail: failure.detail,
            pluginId: null,
          }
        : null,
  };
}
export function readRecovery(
  profile: string,
  storage: RecoveryStorage = sessionStorage,
): AppSafeModeState {
  try {
    return normalize(JSON.parse(storage.getItem(key(profile)) ?? "null"));
  } catch {
    return normalRecovery();
  }
}
export function storeRecovery(
  profile: string,
  state: AppSafeModeState,
  storage: RecoveryStorage = sessionStorage,
): void {
  try {
    if (state.active)
      storage.setItem(key(profile), JSON.stringify(normalize(state)));
    else storage.removeItem(key(profile));
  } catch {
    /* The supplied in-memory state still governs this attempt. */
  }
}
export function startupFailure(
  task: string,
  error: unknown,
): AppSafeModeFailure {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  return {
    task,
    message,
    detail: stack
      ? stack.includes(message)
        ? stack
        : `${message}\n${stack}`
      : message,
    pluginId: null,
  };
}
export function startupDiagnostic(
  vault: string,
  failure: AppSafeModeFailure,
): string {
  return JSON.stringify(
    {
      formatVersion: 1,
      application: "Lapis Notes",
      vaultName: vault,
      phase: failure.task,
      message: failure.message,
      detail: failure.detail,
    },
    null,
    2,
  );
}
