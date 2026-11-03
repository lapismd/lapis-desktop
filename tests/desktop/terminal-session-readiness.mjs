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
