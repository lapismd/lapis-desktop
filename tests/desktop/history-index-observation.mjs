const admitted = new WeakMap();
const invoke = (session, sessionId, kind) =>
  session.browser.execute(
    (sessionId, kind) =>
      globalThis.__TAURI__.core.invoke("desktop_backup_history_search", {
        request: { sessionId, action: { kind } },
      }),
    sessionId,
    kind,
  );

// WDIO retries thrown callbacks; native IPC failures must instead end the check.
async function observeUntil(session, read, complete, timeoutMsg) {
  let latest;
  let failed = false;
  let failure;
  await session.browser.waitUntil(
    async () => {
      try {
        latest = await read();
        return complete(latest);
      } catch (error) {
        failed = true;
        failure = error;
        return true;
      }
    },
    { timeout: 20_000, timeoutMsg },
  );
  if (failed) throw failure;
  return latest;
}

/** Select once per native client; subsequent checks only read cached progress. */
export async function observeHistoryIndex(session, sessionId) {
  let sessions = admitted.get(session);
  if (!sessions) {
    sessions = new Set();
    admitted.set(session, sessions);
  }
  if (!sessions.has(sessionId)) {
    await invoke(session, sessionId, "start");
    sessions.add(sessionId);
  }
  return observeUntil(
    session,
    () => invoke(session, sessionId, "status"),
    (status) => status.complete,
    "The vault-owned History scan must publish without client batch steps",
  );
}

/** Wait for current immutable coverage, without advancing or reselecting work. */
export async function queryHistoryIndex(session, sessionId, search) {
  await observeHistoryIndex(session, sessionId);
  return observeUntil(
    session,
    () =>
      session.browser.execute(
        (sessionId, search) =>
          globalThis.__TAURI__.core.invoke("desktop_backup_history_search", {
            request: { sessionId, action: { kind: "query", search } },
          }),
        sessionId,
        search,
      ),
    (page) => page.status.complete,
    "The native owner must publish current History coverage without client batch steps",
  );
}
