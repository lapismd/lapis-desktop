// Adapted from Server's repository-https-endpoint.mjs / jj-store 086def18 (Apache-2.0).
// Only generated repositories are exposed; Authorization bytes are never recorded.
import { createServer } from "node:http";
import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, appendFileSync } from "node:fs";
import { join } from "node:path";

export async function repositoryHttpFixture(base, token) {
  const environment = {
    PATH: process.env.PATH,
    TMPDIR: process.env.TMPDIR,
    HOME: base,
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_NOSYSTEM: "1",
  };
  const exports = join(base, "exports");
  mkdirSync(exports);
  const git = (args) =>
    execFileSync("git", args, {
      env: environment,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  for (const name of ["token", "anonymous"]) {
    const path = join(exports, `${name}.git`);
    git(["init", "--bare", "--quiet", "--initial-branch=main", path]);
    git(["--git-dir", path, "config", "http.receivepack", "true"]);
  }
  const facts = {
    receives: 0,
    authenticatedReads: 0,
    anonymousReads: 0,
    leaked: 0,
  };
  const children = new Set();
  const server = createServer((request, response) => {
    const url = new URL(request.url, "http://localhost");
    if (
      !/^\/(token|anonymous)\.git\/(info\/refs|git-upload-pack|git-receive-pack)$/.test(
        url.pathname,
      )
    ) {
      response.writeHead(404).end();
      return;
    }
    const anonymous = url.pathname.startsWith("/anonymous.git/");
    if (anonymous) {
      facts.anonymousReads++;
      if (request.headers.authorization) facts.leaked++;
      if (url.pathname.endsWith("git-receive-pack")) {
        response.writeHead(403).end();
        return;
      }
    } else {
      const expected =
        "Basic " + Buffer.from("fixture-user:" + token).toString("base64");
      if (request.headers.authorization !== expected) {
        response
          .writeHead(401, {
            "WWW-Authenticate": 'Basic realm="Disposable Lapis fixture"',
          })
          .end();
        return;
      }
      facts.authenticatedReads++;
      if (url.pathname.endsWith("/git-receive-pack")) facts.receives++;
    }
    const child = spawn(
      "git",
      ["-c", "core.hooksPath=/dev/null", "http-backend"],
      {
        env: {
          ...environment,
          GIT_PROJECT_ROOT: exports,
          GIT_HTTP_EXPORT_ALL: "1",
          PATH_INFO: url.pathname,
          QUERY_STRING: url.search.slice(1),
          REQUEST_METHOD: request.method,
          SERVER_PROTOCOL: "HTTP/1.1",
          HTTPS: "on",
          REMOTE_ADDR: "127.0.0.1",
          REMOTE_USER: anonymous ? "" : "fixture-user",
          CONTENT_TYPE: request.headers["content-type"] ?? "",
          CONTENT_LENGTH: request.headers["content-length"] ?? "",
        },
        stdio: ["pipe", "pipe", "ignore"],
      },
    );
    children.add(child);
    let received = 0;
    request.on("data", (bytes) => {
      received += bytes.length;
      if (received > 16 * 1024 * 1024) {
        request.destroy();
        child.kill();
      }
    });
    request.pipe(child.stdin);
    child.stdin.on("error", () => {});
    let pending = Buffer.alloc(0),
      headers = false;
    child.stdout.on("data", (bytes) => {
      if (headers) {
        response.write(bytes);
        return;
      }
      pending = Buffer.concat([pending, bytes]);
      const end = pending.indexOf("\r\n\r\n");
      if (end < 0) {
        if (pending.length > 16384) child.kill();
        return;
      }
      const fields = {};
      let status = 200;
      for (const line of pending.subarray(0, end).toString().split("\r\n")) {
        const colon = line.indexOf(":");
        if (colon < 0) continue;
        const key = line.slice(0, colon),
          value = line.slice(colon + 1).trim();
        if (key.toLowerCase() === "status") status = Number.parseInt(value, 10);
        else fields[key] = value;
      }
      response.writeHead(status, fields);
      response.write(pending.subarray(end + 4));
      pending = Buffer.alloc(0);
      headers = true;
    });
    child.on("error", () => response.destroy());
    child.on("close", () => {
      children.delete(child);
      response.end();
    });
    response.on("close", () => {
      if (child.exitCode === null) child.kill();
    });
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  let tunnel;
  try {
    const home = join(base, "tunnel-home");
    mkdirSync(home, { mode: 0o700 });
    tunnel = spawn(
      "/usr/bin/ssh",
      [
        "-T",
        "-F",
        "/dev/null",
        "-oBatchMode=yes",
        "-oIdentityAgent=none",
        "-oIdentityFile=none",
        "-oIdentitiesOnly=yes",
        "-oStrictHostKeyChecking=accept-new",
        "-oGlobalKnownHostsFile=/dev/null",
        `-oUserKnownHostsFile=${join(base, "tunnel-known-hosts")}`,
        "-oServerAliveInterval=15",
        "-oServerAliveCountMax=2",
        "-R",
        `80:127.0.0.1:${server.address().port}`,
        "nokey@localhost.run",
      ],
      {
        env: { ...environment, HOME: home },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    const endpoint = await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Disposable HTTPS tunnel did not become ready")),
        60000,
      );
      let log = "";
      const observe = (bytes) => {
        appendFileSync(join(base, "tunnel.log"), bytes);
        log = (log + bytes).slice(-32768);
        const match = log.match(/https:\/\/[a-z0-9-]+(?:\.app)?\.lhr\.life/);
        if (match) {
          clearTimeout(timer);
          resolve(match[0]);
        }
      };
      tunnel.stdout.on("data", observe);
      tunnel.stderr.on("data", observe);
      tunnel.once("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
      tunnel.once("exit", () => {
        clearTimeout(timer);
        reject(new Error("Disposable HTTPS tunnel exited"));
      });
    });
    const until = Date.now() + 60000;
    let ready = false;
    let lastStatus = "no response";
    while (Date.now() < until) {
      try {
        const response = await fetch(
          `${endpoint}/anonymous.git/info/refs?service=git-upload-pack`,
          { signal: AbortSignal.timeout(5000) },
        );
        const body = await response.text();
        lastStatus =
          String(response.status) +
          " " +
          body.slice(0, 160).replace(/\s+/g, " ");
        if (response.ok) {
          ready = true;
          break;
        }
      } catch (error) {
        lastStatus = String(error.cause?.code ?? error.message);
        /* Wait only for this owned endpoint; no publication is replayed. */
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    if (!ready)
      throw new Error(
        "Disposable HTTPS origin did not become ready: " + lastStatus,
      );
    return {
      endpoint,
      facts,
      refs: () =>
        git([
          "--git-dir",
          join(exports, "token.git"),
          "for-each-ref",
          "--format=%(refname) %(objectname)",
        ]),
      async close() {
        tunnel?.kill();
        for (const child of children) child.kill();
        server.closeAllConnections();
        await new Promise((resolve) => server.close(resolve));
      },
    };
  } catch (error) {
    tunnel?.kill();
    for (const child of children) child.kill();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    throw error;
  }
}
