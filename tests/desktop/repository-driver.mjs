import assert from "node:assert/strict";
import { HistoryClient } from "@lapismd/jj-history";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { writeFileSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
export async function invoke(session, command, args = {}) {
  return session.browser.execute(
    async (command, args) => {
      try {
        return {
          value: await globalThis.__TAURI__.core.invoke(command, args),
          failure: null,
        };
      } catch (error) {
        return {
          value: null,
          failure: {
            code: error?.code ?? null,
            message:
              typeof error === "string"
                ? error
                : String(error?.message ?? error),
          },
        };
      }
    },
    command,
    args,
  );
}
export async function success(session, command, args = {}) {
  const result = await invoke(session, command, args);
  assert.equal(
    result.failure,
    null,
    `${command}: ${JSON.stringify(result.failure)}`,
  );
  return result.value;
}
const tokens = new WeakMap();
export async function history(session, method, data, outer = data.vault) {
  const token = tokens.get(session)?.get(data.vault) ?? data.vault;
  const client = new HistoryClient(token, {
    invoke: (method, frame) =>
      success(session, "desktop_repository_read", {
        request: { sessionId: outer, method, frame },
      }),
  });
  switch (method) {
    case "heads":
      return client.heads();
    case "open":
      return client.open(data.operation);
    case "status":
      return client.status(data.handle);
    case "read":
      return client.read(data.handle, data.query);
    default:
      throw Error(`Unhandled History fixture method: ${method}`);
  }
}
export async function historyResult(session, method, data, outer = data.vault) {
  try {
    return {
      value: await history(session, method, data, outer),
      failure: null,
    };
  } catch (failure) {
    return { value: null, failure };
  }
}
export async function admit(session, id) {
  await success(session, "desktop_repository_admit", {
    request: { sessionId: id },
  });
  const source = await success(session, "desktop_repository_sources", {
    request: { sessionId: id, openOriginal: true },
  });
  assert.equal(source.original, true);
  assert.ok(source.token);
  if (!tokens.has(session)) tokens.set(session, new Map());
  tokens.get(session).set(id, source.token);
  return source.token;
}
export async function select(session, root, path) {
  writeFileSync(join(root, "picker.json"), JSON.stringify(path));
  return success(session, "vault_select");
}
export async function quiet(session) {
  const state = await success(session, "shell_info");
  assert.equal(state.backgroundApi, true);
  assert.equal(state.nativeVisibility.Ok[0], false);
  assert.equal(state.nativeVisibility.Ok[4], false);
  assert.equal(await session.browser.execute(() => document.hasFocus()), false);
}
export function jj(root, args) {
  return execFileSync(
    "/opt/homebrew/bin/jj",
    [
      "--no-pager",
      "--config",
      "user.name='Fixture'",
      "--config",
      "user.email='fixture@invalid'",
      ...args,
    ],
    {
      cwd: root,
      env: {
        ...process.env,
        JJ_CONFIG: "/dev/null",
        GIT_CONFIG_NOSYSTEM: "1",
        GIT_CONFIG_GLOBAL: "/dev/null",
      },
      encoding: "utf8",
    },
  );
}
export function digest(root) {
  const files = [];
  function walk(at) {
    for (const entry of readdirSync(at, { withFileTypes: true })) {
      const path = join(at, entry.name);
      if (entry.isDirectory()) walk(path);
      else
        files.push([
          path.slice(root.length),
          createHash("sha256").update(readFileSync(path)).digest("hex"),
        ]);
    }
  }
  walk(root);
  return files.sort((a, b) => a[0].localeCompare(b[0]));
}
export async function ready(session, vault, handle) {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    const status = await history(session, "status", { vault, handle });
    if (status.state !== "preparing") {
      assert.equal(
        status.state,
        "ready",
        JSON.stringify(status, (_, value) =>
          typeof value === "bigint" ? String(value) : value,
        ),
      );
      return status.data;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert.fail("Native history preparation did not complete");
}
