export type ShellLoading = {
  close(): Promise<void>;
  fail(error: unknown): void;
};

/** Mount progress before importing or initializing the application graph. */
export async function loadShell(
  show: () => Promise<ShellLoading>,
  load: () => Promise<unknown>,
): Promise<void> {
  const loading = await show();
  try {
    await load();
    await loading.close();
  } catch (error) {
    loading.fail(error);
    throw error;
  }
}
