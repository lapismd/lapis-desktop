const terminalNotAdmitted = /Terminal is disabled or no vault is admitted/u;

/** The product refuses list before Terminal admission. That is an empty baseline. */
export function absentTerminalAdmission(error) {
  const message =
    typeof error === "string" ? error : String(error?.message ?? error);
  return terminalNotAdmitted.test(message);
}

export async function readExistingTerminalSessions(read) {
  try {
    return await read();
  } catch (error) {
    if (absentTerminalAdmission(error)) return [];
    throw error;
  }
}

/** Wait for the one terminal session admitted by the current UI request. */
export async function waitForNewTerminalSession(browser, read, previous) {
  const existing = new Set(previous.map(({ id }) => id));
  let opened;
  await browser.waitUntil(async () => {
    const additions = (await read()).filter(({ id }) => !existing.has(id));
    if (additions.length > 1)
      throw new Error("Terminal request admitted multiple new sessions");
    [opened] = additions;
    return Boolean(opened);
  });
  return opened;
}
